import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  AgentPositionSchema,
  AgentResultSchema,
  DebateContextSchema,
  VerdictSchema,
} from './schemas.js';
import {
  FINAL_MODERATOR_PROMPT,
  INITIAL_MODERATOR_PROMPT,
} from './agents.js';
import { logAiFailure } from './safeLogger.js';

const MAX_ATTEMPT_MS = 15_000;
const RETRY_MIN_REMAINING_MS = 8_000;
const MIN_CALLABLE_MS = 3_000;
const INITIAL_MODERATOR_MODEL = 'gpt-5.6-luna';
const INITIAL_MODERATOR_EFFORT = 'low';
const FINAL_MODERATOR_MODEL = 'gpt-5.6-terra';
const FINAL_MODERATOR_EFFORT = 'medium';

let openaiClient;

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OPENAI_API_KEY is not configured');
    error.name = 'ConfigurationError';
    throw error;
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
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
        lastError = new Error(`OpenAI request timed out after ${timeoutMs}ms`);
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

async function structuredResponse({ schema, schemaName, systemPrompt, userPrompt, model, reasoningEffort, signal }) {
  const response = await getClient().responses.parse({
    model,
    input: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    text: { format: zodTextFormat(schema, schemaName) },
    reasoning: { effort: reasoningEffort },
  }, { signal });

  if (!response.output_parsed) {
    const error = new Error('OpenAI returned no structured output');
    error.name = 'InvalidResponseError';
    throw error;
  }

  try {
    return schema.parse(response.output_parsed);
  } catch (error) {
    error.name = 'InvalidResponseError';
    throw error;
  }
}

export function createFallbackContext(idea, reason = 'budget_exhausted') {
  return DebateContextSchema.parse({
    problem: idea.slice(0, 500),
    targetUsers: 'Usuarios potenciales descritos en la idea, por validar.',
    valueProposition: 'La propuesta de valor debe validarse con usuarios reales antes de invertir más recursos.',
    keyAssumptions: [
      'Existe una necesidad frecuente y relevante.',
      'El público objetivo adoptará una solución nueva.',
    ],
    evaluationCriteria: ['Deseabilidad', 'Viabilidad técnica', 'Riesgo', 'Sostenibilidad del modelo'],
    unknowns: [`Contexto generado como respaldo por ${reason}.`, 'Demanda y disposición a pagar.'],
  });
}

export async function createDebateContext({ idea, context, deadlineAt }) {
  return requestWithBudget({
    deadlineAt,
    fallback: (reason) => ({
      context: createFallbackContext(idea, reason),
      status: 'fallback',
    }),
    logContext: { provider: 'openai', operation: 'initial_moderator' },
    request: async (signal) => ({
      context: await structuredResponse({
        schema: DebateContextSchema,
        schemaName: 'debate_context',
        systemPrompt: INITIAL_MODERATOR_PROMPT,
        userPrompt: `Propuesta a evaluar:\n${idea}\n\nContexto adicional:\n${context || 'No proporcionado'}`,
        model: INITIAL_MODERATOR_MODEL,
        reasoningEffort: INITIAL_MODERATOR_EFFORT,
        signal,
      }),
      status: 'complete',
    }),
  });
}

function fallbackCopy(agent) {
  const copies = {
    strategy: 'Falta validar que el segmento objetivo priorice este problema y adopte la propuesta.',
    technology: 'La viabilidad técnica requiere confirmar las dependencias y construir un prototipo mínimo.',
    ux: 'Conviene observar a usuarios reales para descubrir fricciones y señales de confianza.',
    risk: 'Hay riesgos no cuantificados que deben priorizarse antes de escalar la idea.',
    critic: 'La principal objeción es que la demanda y la disposición a cambiar de comportamiento aún no están demostradas.',
  };
  return copies[agent.id];
}

export function createFallbackAgentResult({ agent, round, reason = 'budget_exhausted' }) {
  const summary = fallbackCopy(agent);
  return AgentResultSchema.parse({
    agentId: agent.id,
    agentName: agent.name,
    role: agent.role,
    round,
    stance: 'caution',
    score: 5,
    summary,
    arguments: [
      { claim: 'La evidencia disponible es insuficiente.', reason: 'No se pudo completar la evaluación especializada.' },
      { claim: 'La idea debe validarse con usuarios reales.', reason: 'Una prueba pequeña reduce el riesgo de decidir por intuición.' },
    ],
    risks: [{
      risk: 'Supuesto clave sin validar.',
      probability: 3,
      impact: 3,
      mitigation: 'Ejecutar entrevistas y un experimento de interés en 48 horas.',
    }],
    recommendation: 'pivot',
    changedPosition: false,
    changeReason: null,
    responseTo: [],
    status: 'fallback',
    fallbackReason: reason,
  });
}

function buildAgentPrompt({ agent, round, idea, context, priorPositions }) {
  const crossRoundInstructions = round === 2
    ? 'Esta es la ronda de réplica. Considera las posturas de los demás. Marca changedPosition=true solo si cambias de forma real y usa responseTo para indicar qué roles influyeron.'
    : 'Esta es la postura inicial. changedPosition debe ser false y responseTo debe ser una lista vacía.';

  return `Debates una propuesta como ${agent.role}. ${agent.systemPrompt}
${crossRoundInstructions}
Devuelve los campos estructurados solicitados. Cada argumento debe incluir claim y reason; cada riesgo debe incluir risk, probability (1..5), impact (1..5) y mitigation.

Idea:\n${idea}

Contexto común:\n${JSON.stringify(context)}

Posturas previas:\n${JSON.stringify(priorPositions || [])}`;
}

export async function evaluateAgent({ agent, round, idea, context, priorPositions = [], deadlineAt }) {
  return requestWithBudget({
    deadlineAt,
    fallback: (reason) => createFallbackAgentResult({ agent, round, reason }),
    logContext: {
      provider: 'openai',
      operation: 'agent_evaluation',
      agentId: agent.id,
      round,
    },
    request: async (signal) => {
      const parsed = await structuredResponse({
        schema: AgentPositionSchema,
        schemaName: `agent_${agent.id}_round_${round}`,
        systemPrompt: 'Responde únicamente con una salida estructurada. No inventes evidencia ni reveles razonamiento interno.',
        userPrompt: buildAgentPrompt({ agent, round, idea, context, priorPositions }),
        model: agent.model,
        reasoningEffort: agent.reasoningEffort,
        signal,
      });

      return AgentResultSchema.parse({
        ...parsed,
        agentId: agent.id,
        agentName: agent.name,
        role: agent.role,
        round,
        status: 'complete',
        fallbackReason: null,
      });
    },
  });
}

export function createFallbackVerdict({ round1, round2, reason = 'budget_exhausted' }) {
  const results = [...round1, ...round2].filter((result) => result.status === 'complete');
  const average = results.length
    ? results.reduce((sum, result) => sum + result.score, 0) / results.length
    : 5;
  const decision = average >= 7 ? 'advance' : average >= 4 ? 'pivot' : 'discard';
  const risks = [...round2, ...round1]
    .flatMap((result) => result.risks)
    .sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact))
    .slice(0, 3);

  return VerdictSchema.parse({
    decision,
    overallScore: Number(average.toFixed(1)),
    confidence: results.length >= 7 ? 'medium' : 'low',
    rationale: `Veredicto de respaldo: se sintetizaron las posturas disponibles sin moderación final (${reason}).`,
    pros: ['Existe una hipótesis de valor que puede ponerse a prueba.', 'El debate produjo criterios concretos para validar la idea.'],
    cons: ['La evidencia disponible sigue siendo limitada.', 'Se requiere validar la demanda con usuarios reales.'],
    prioritizedRisks: risks.length ? risks : [{
      risk: 'Falta de evidencia de demanda.',
      probability: 3,
      impact: 4,
      mitigation: 'Entrevistar usuarios y ejecutar un experimento de interés.',
    }],
    experiment: {
      hypothesis: 'El público objetivo percibe suficiente valor como para probar la solución.',
      action: 'Realizar cinco entrevistas breves y presentar un prototipo o propuesta concreta.',
      successMetric: 'Al menos tres participantes describen el problema como prioritario y aceptan una siguiente prueba.',
      timeboxHours: 48,
    },
  });
}

function compactRound(results) {
  return results.map((result) => ({
    agentId: result.agentId,
    score: result.score,
    stance: result.stance,
    recommendation: result.recommendation,
    summary: result.summary.slice(0, 500),
    arguments: (result.arguments || []).slice(0, 1).map((argument) => ({
      claim: argument.claim.slice(0, 220),
      reason: argument.reason.slice(0, 220),
    })),
    risks: (result.risks || []).slice(0, 1).map((risk) => ({
      risk: risk.risk.slice(0, 220),
      probability: risk.probability,
      impact: risk.impact,
      mitigation: risk.mitigation.slice(0, 220),
    })),
  }));
}

export async function createFinalVerdict({ idea, context, round1, round2, deadlineAt, remainingMs: globalRemainingMs }) {
  return requestWithBudget({
    deadlineAt,
    fallback: (reason) => ({
      ...createFallbackVerdict({ round1, round2, reason }),
      status: 'fallback',
      fallbackReason: reason,
    }),
    logContext: { provider: 'openai', operation: 'final_moderator' },
    request: async (signal) => ({
      ...(await structuredResponse({
        schema: VerdictSchema,
        schemaName: 'debate_verdict',
        systemPrompt: FINAL_MODERATOR_PROMPT,
        userPrompt: `Tiempo global restante aproximado: ${globalRemainingMs} ms. Prioriza terminar un JSON completo y conciso.\n\nIdea:\n${idea}\n\nContexto estructurado:\n${JSON.stringify(context)}\n\nRonda 1:\n${JSON.stringify(compactRound(round1))}\n\nRonda 2:\n${JSON.stringify(compactRound(round2))}`,
        model: FINAL_MODERATOR_MODEL,
        reasoningEffort: FINAL_MODERATOR_EFFORT,
        signal,
      })),
      status: 'complete',
      fallbackReason: null,
    }),
  });
}
