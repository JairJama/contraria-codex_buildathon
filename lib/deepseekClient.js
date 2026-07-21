import OpenAI from 'openai';
import { AgentPositionSchema, AgentResultSchema } from './schemas.js';
import { createFallbackAgentResult } from './openaiClient.js';

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

async function requestWithBudget({ deadlineAt, fallback, request }) {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const availableMs = remainingMs(deadlineAt);
    if (availableMs < MIN_CALLABLE_MS) return fallback('budget_exhausted');

    const timeoutMs = Math.min(MAX_ATTEMPT_MS, availableMs);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await request(controller.signal);
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timer);
    }

    const canRetry = attempt === 0
      && retryable(lastError)
      && remainingMs(deadlineAt) >= RETRY_MIN_REMAINING_MS;
    if (!canRetry) break;
  }

  return fallback(fallbackReason(lastError));
}

function buildPrompt({ agent, round, idea, context, priorPositions }) {
  const crossRoundInstructions = round === 2
    ? 'Esta es la ronda de réplica. Considera las posturas de los demás. Marca changedPosition=true solo si cambias de forma real y usa responseTo para indicar qué roles influyeron.'
    : 'Esta es la postura inicial. changedPosition debe ser false y responseTo debe ser una lista vacía.';

  return `Debates una propuesta como ${agent.role}. ${agent.systemPrompt}
${crossRoundInstructions}
Devuelve exclusivamente JSON válido con los campos: stance, score, summary, arguments, risks, recommendation, changedPosition, changeReason y responseTo.
Cada argumento es {claim, reason}; cada riesgo es {risk, probability: 1..5, impact: 1..5, mitigation}.

Idea:\n${idea}

Contexto común:\n${JSON.stringify(context)}

Posturas previas:\n${JSON.stringify(priorPositions || [])}`;
}

async function modelResponse({ agent, round, idea, context, priorPositions, signal }) {
  const completion = await getClient().chat.completions.create({
    model: agent.model,
    messages: [
      { role: 'system', content: 'Responde en JSON válido, sin markdown ni texto adicional.' },
      { role: 'user', content: buildPrompt({ agent, round, idea, context, priorPositions }) },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 900,
    thinking: { type: 'disabled' },
  }, { signal });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error('DeepSeek returned no JSON content');
    error.name = 'InvalidResponseError';
    throw error;
  }

  try {
    const parsed = AgentPositionSchema.parse(JSON.parse(content));
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

export async function evaluateDeepSeekAgent({ agent, round, idea, context, priorPositions = [], deadlineAt }) {
  return requestWithBudget({
    deadlineAt,
    fallback: (reason) => createFallbackAgentResult({ agent, round, reason }),
    request: (signal) => modelResponse({ agent, round, idea, context, priorPositions, signal }),
  });
}
