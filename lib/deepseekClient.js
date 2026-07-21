import OpenAI from 'openai';
import { AgentPositionSchema, AgentResultSchema } from './schemas.js';
import { createFallbackAgentResult } from './openaiClient.js';
import { logAiFailure } from './safeLogger.js';

const MAX_ATTEMPT_MS = 15_000;
const RETRY_MIN_REMAINING_MS = 8_000;
const MIN_CALLABLE_MS = 3_000;

let deepseekClient;

function getClient() {
  if (!process.env.DEEPSEEK_API_KEY) {
    const error = new Error('DEEPSEEK_API_KEY is not configured');
    error.name = 'ConfigurationError';
    throw error;
  }

  if (!deepseekClient) {
    deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    });
  }

  return deepseekClient;
}

function remainingMs(deadlineAt) {
  return Math.max(0, deadlineAt - Date.now());
}

function retryable(error) {
  if (error?.name === 'ConfigurationError') return false;
  if (error?.name === 'InvalidResponseError' || error?.name === 'ZodError') return true;
  if (error?.name === 'AbortError' || /timeout/i.test(error?.name || '')) return true;
  if (typeof error?.status === 'number') return error.status === 429 || error.status >= 500;
  return /connection|network|fetch/i.test(error?.message || '');
}

function fallbackReason(error) {
  if (error?.name === 'ConfigurationError') return 'configuration';
  if (error?.name === 'AbortError' || /timeout/i.test(error?.name || '')) return 'timeout';
  if (error?.name === 'InvalidResponseError' || error?.name === 'ZodError') return 'invalid_response';
  return 'api_error';
}

async function requestWithBudget({ deadlineAt, fallback, request, logContext }) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const availableMs = remainingMs(deadlineAt);
    if (availableMs < MIN_CALLABLE_MS) return fallback('budget_exhausted');

    const timeoutMs = Math.min(MAX_ATTEMPT_MS, availableMs);
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);

    try {
      return await request(controller.signal);
    } catch (error) {
      if (timedOut) {
        lastError = new Error(`DeepSeek request timed out after ${timeoutMs}ms`);
        lastError.name = 'TimeoutError';
      } else {
        lastError = error;
      }
    } finally {
      clearTimeout(timer);
    }

    const canRetry = attempt === 0
      && retryable(lastError)
      && remainingMs(deadlineAt) >= RETRY_MIN_REMAINING_MS;
    logAiFailure({
      ...logContext,
      attempt: attempt + 1,
      willRetry: canRetry,
      error: lastError,
    });
    if (!canRetry) break;
  }

  return fallback(fallbackReason(lastError));
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function asTrimmedArray(value, maxLength = 3) {
  return asArray(value).slice(0, maxLength);
}

function normalizeBoolean(value) {
  if (typeof value === 'string') return ['true', 'si', 'sí', 'yes'].includes(normalizeKey(value));
  return Boolean(value);
}

function normalizeStance(value) {
  const normalized = normalizeKey(value);
  if (['support', 'supportive', 'favor', 'a favor', 'positivo'].includes(normalized)) return 'support';
  if (['oppose', 'opposed', 'contra', 'negativo'].includes(normalized)) return 'oppose';
  return 'caution';
}

function normalizeRecommendation(value) {
  const normalized = normalizeKey(value);
  if (['advance', 'avanzar', 'proceed'].includes(normalized)) return 'advance';
  if (['discard', 'descartar', 'reject'].includes(normalized)) return 'discard';
  return 'pivot';
}

function normalizeAgentId(value) {
  const normalized = normalizeKey(value);
  const aliases = {
    strategy: 'strategy', estrategia: 'strategy',
    technology: 'technology', tecnologia: 'technology', cto: 'technology',
    ux: 'ux', usuario: 'ux', user: 'ux',
    risk: 'risk', riesgo: 'risk',
    critic: 'critic', critico: 'critic', 'abogado del diablo': 'critic',
  };
  return aliases[normalized] || null;
}

function normalizeArgument(value) {
  if (typeof value === 'string') return { claim: value, reason: value };
  return {
    claim: value?.claim ?? value?.afirmacion ?? value?.argument ?? '',
    reason: value?.reason ?? value?.razon ?? value?.justification ?? '',
  };
}

function normalizeRisk(value) {
  return {
    risk: value?.risk ?? value?.riesgo ?? '',
    probability: Number(value?.probability ?? value?.probabilidad),
    impact: Number(value?.impact ?? value?.impacto),
    mitigation: value?.mitigation ?? value?.mitigacion ?? '',
  };
}

function parseJsonContent(content) {
  if (typeof content !== 'string') {
    const error = new Error('DeepSeek returned non-text JSON content');
    error.name = 'InvalidResponseError';
    throw error;
  }

  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const candidates = [trimmed];
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) candidates.push(trimmed.slice(firstBrace, lastBrace + 1));

  let parseError;
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      parseError = error;
      // Try the next JSON boundary before reporting a format failure.
    }
  }

  const error = new Error(`DeepSeek returned malformed JSON content (${parseError?.message || 'parse error'})`);
  error.name = 'InvalidResponseError';
  throw error;
}

export function normalizeDeepSeekPosition(content) {
  const source = parseJsonContent(content);
  const rawScore = Number(String(source.score ?? source.puntuacion ?? '').replace(',', '.'));
  const score = rawScore > 10 && rawScore <= 100 ? rawScore / 10 : rawScore;
  const responseTo = asTrimmedArray(source.responseTo ?? source.respondeA)
    .map(normalizeAgentId)
    .filter(Boolean);
  const changeReason = source.changeReason ?? source.razonCambio ?? null;

  return {
    stance: normalizeStance(source.stance ?? source.posture ?? source.postura),
    score,
    summary: source.summary ?? source.resumen ?? '',
    arguments: asTrimmedArray(source.arguments ?? source.argumentos).map(normalizeArgument),
    risks: asTrimmedArray(source.risks ?? source.riesgos).map(normalizeRisk),
    recommendation: normalizeRecommendation(source.recommendation ?? source.recomendacion),
    changedPosition: normalizeBoolean(source.changedPosition ?? source.cambioDePostura ?? false),
    changeReason: typeof changeReason === 'string' && !changeReason.trim() ? null : changeReason,
    responseTo,
  };
}

function buildPrompt({ agent, round, idea, context, priorPositions, webEvidence }) {
  const crossRoundInstructions = round === 2
    ? 'Esta es la ronda de réplica. Considera las posturas de los demás. Marca changedPosition=true solo si cambias de forma real y usa responseTo para indicar qué roles influyeron.'
    : 'Esta es la postura inicial. changedPosition debe ser false y responseTo debe ser una lista vacía.';

  return `Debates una propuesta como ${agent.role}. ${agent.systemPrompt}
${crossRoundInstructions}
Devuelve exclusivamente JSON válido con los campos: stance, score, summary, arguments, risks, recommendation, changedPosition, changeReason y responseTo.
score debe ser un número de 1 a 10, nunca un porcentaje. Incluye 2 o 3 argumentos y 1 a 3 riesgos, no más. Cada argumento es {claim, reason}; cada riesgo es {risk, probability: 1..5, impact: 1..5, mitigation}. Mantén summary, claim, reason y mitigation por debajo de 180 caracteres. Si no cambiaste de postura, changeReason debe ser null.

Idea:\n${idea}

Contexto común:\n${JSON.stringify(context)}

Posturas previas:\n${JSON.stringify(priorPositions || [])}

Evidencia externa opcional:\n${webEvidence?.summary && webEvidence?.citations?.length
    ? `${webEvidence.summary}\n\nFuentes disponibles:\n${webEvidence.citations.map((citation) => `[${citation.id}] ${citation.title}: ${citation.url}`).join('\n')}\n\nÚsala solo como contexto complementario; no inventes datos ni URLs.`
    : 'No se consultó evidencia web adicional. Distingue los hechos del contexto de los supuestos.'}`;
}

async function modelResponse({ agent, round, idea, context, priorPositions, webEvidence, signal }) {
  const completion = await getClient().chat.completions.create({
    model: agent.model,
    messages: [
      { role: 'system', content: 'Responde en JSON válido, sin markdown ni texto adicional.' },
      { role: 'user', content: buildPrompt({ agent, round, idea, context, priorPositions, webEvidence }) },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 1_000,
    thinking: { type: 'disabled' },
  }, { signal });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('DeepSeek returned no JSON content');
    error.name = 'InvalidResponseError';
    throw error;
  }

  try {
    const parsed = AgentPositionSchema.parse(normalizeDeepSeekPosition(content));
    return AgentResultSchema.parse({
      ...parsed,
      agentId: agent.id,
      agentName: agent.name,
      role: agent.role,
      round,
      status: 'complete',
      fallbackReason: null,
    });
  } catch (error) {
    error.name = 'InvalidResponseError';
    throw error;
  }
}

export async function evaluateDeepSeekAgent({ agent, round, idea, context, priorPositions = [], webEvidence, deadlineAt }) {
  return requestWithBudget({
    deadlineAt,
    fallback: (reason) => createFallbackAgentResult({ agent, round, reason }),
    logContext: {
      provider: 'deepseek',
      operation: 'agent_evaluation',
      agentId: agent.id,
      round,
    },
    request: (signal) => modelResponse({ agent, round, idea, context, priorPositions, webEvidence, signal }),
  });
}
