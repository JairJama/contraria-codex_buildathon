const SENSITIVE_TEXT = /(?:api[_-]?key|authorization|bearer)\s*[:=]\s*[^\s,;]+|sk-[A-Za-z0-9_-]+/gi;
const MAX_MESSAGE_LENGTH = 300;

function safeMessage(error) {
  const message = typeof error?.message === 'string' ? error.message : 'Unknown provider error';
  return message
    .replace(SENSITIVE_TEXT, '[redacted]')
    .replace(/\s+/g, ' ')
    .slice(0, MAX_MESSAGE_LENGTH);
}

export function logAiFailure({ provider, operation, agentId = null, round = null, attempt, willRetry, error }) {
  console.error(JSON.stringify({
    event: 'ai_request_failed',
    provider,
    operation,
    agentId,
    round,
    attempt,
    willRetry,
    errorName: error?.name || 'Error',
    status: typeof error?.status === 'number' ? error.status : null,
    code: error?.code || null,
    message: safeMessage(error),
  }));
}

export function logDebateFallback({ phase, agentId = null, reason }) {
  console.warn(JSON.stringify({
    event: 'debate_fallback_used',
    phase,
    agentId,
    reason,
  }));
}
