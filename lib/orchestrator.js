import { AGENTS } from './agents.js';
import {
  DebateRequestSchema,
  DebateResponseSchema,
  VerdictResultSchema,
} from './schemas.js';
import {
  createDebateContext,
  createFallbackAgentResult,
  createFallbackContext,
  createFallbackVerdict,
  createFinalVerdict,
  evaluateAgent,
  createEmptyWebEvidence,
  researchWebEvidence,
} from './openaiClient.js';
import { evaluateDeepSeekAgent } from './deepseekClient.js';
import { logDebateFallback } from './safeLogger.js';

export const DEADLINE_MS = 55_000;

const MIN_PHASE_MS = 3_000;
const HTTP_BUFFER_MS = 1_000;
const PHASE_BUDGETS_MS = {
  initialModerator: 10_000,
  round1: 18_000,
  round2: 18_000,
  finalModerator: 15_000,
};

function remainingMs(deadlineAt) {
  return Math.max(0, deadlineAt - Date.now());
}

function startPhase(execution, phaseName) {
  const remaining = remainingMs(execution.deadlineAt);
  const usableRemaining = Math.max(0, remaining - HTTP_BUFFER_MS);
  const phaseDeadlineAt = Date.now() + Math.min(PHASE_BUDGETS_MS[phaseName], usableRemaining);

  return {
    shouldSkip: usableRemaining < MIN_PHASE_MS || phaseDeadlineAt - Date.now() < MIN_PHASE_MS,
    deadlineAt: Math.min(phaseDeadlineAt, execution.deadlineAt - HTTP_BUFFER_MS),
    remaining,
  };
}

function summarizeRound(results) {
  return results.map((result) => ({
    agentId: result.agentId,
    agentName: result.agentName,
    score: result.score,
    stance: result.stance,
    recommendation: result.recommendation,
    summary: result.summary.slice(0, 500),
    arguments: result.arguments.slice(0, 1).map((argument) => ({
      claim: argument.claim.slice(0, 220),
      reason: argument.reason.slice(0, 220),
    })),
  }));
}

async function runRound({ round, idea, context, priorPositions, webEvidence, phase }) {
  if (phase.shouldSkip) {
    logDebateFallback({ phase: `round_${round}`, reason: 'budget_exhausted' });
    return AGENTS.map((agent) => createFallbackAgentResult({
      agent,
      round,
      reason: 'budget_exhausted',
    }));
  }

  return Promise.all(AGENTS.map(async (agent) => {
    try {
      const evaluate = agent.provider === 'deepseek' ? evaluateDeepSeekAgent : evaluateAgent;
      return await evaluate({
        agent,
        round,
        idea,
        context,
        priorPositions,
        webEvidence,
        deadlineAt: phase.deadlineAt,
      });
    } catch {
      logDebateFallback({ phase: `round_${round}`, agentId: agent.id, reason: 'api_error' });
      return createFallbackAgentResult({ agent, round, reason: 'api_error' });
    }
  }));
}

export async function runDebate(payload, { startTime = Date.now(), deadlineMs = DEADLINE_MS } = {}) {
  const input = DebateRequestSchema.parse(payload);
  const execution = { startTime, deadlineAt: startTime + deadlineMs };

  const initialPhase = startPhase(execution, 'initialModerator');
  const initialContextPromise = initialPhase.shouldSkip
    ? (logDebateFallback({ phase: 'initial_moderator', reason: 'budget_exhausted' }), Promise.resolve({
      context: createFallbackContext(input.idea, 'budget_exhausted'),
      status: 'fallback',
    }))
    : createDebateContext({
      idea: input.idea,
      context: input.context,
      deadlineAt: initialPhase.deadlineAt,
    });
  const webEvidencePromise = input.useWebEvidence && !initialPhase.shouldSkip
    ? researchWebEvidence({ idea: input.idea, context: input.context, deadlineAt: initialPhase.deadlineAt })
    : Promise.resolve(createEmptyWebEvidence({
      requested: input.useWebEvidence,
      status: input.useWebEvidence ? 'fallback' : 'not_requested',
    }));
  const [initialContext, webEvidence] = await Promise.all([initialContextPromise, webEvidencePromise]);
  const context = initialContext.context;

  const round1 = await runRound({
    round: 1,
    idea: input.idea,
    context,
    priorPositions: [],
    webEvidence,
    phase: startPhase(execution, 'round1'),
  });

  const round2 = await runRound({
    round: 2,
    idea: input.idea,
    context,
    priorPositions: summarizeRound(round1),
    webEvidence,
    phase: startPhase(execution, 'round2'),
  });

  const finalPhase = startPhase(execution, 'finalModerator');
  const fallbackVerdict = {
    ...createFallbackVerdict({ round1, round2, reason: 'budget_exhausted' }),
    status: 'fallback',
    fallbackReason: 'budget_exhausted',
    citations: webEvidence.citations,
  };
  const verdict = finalPhase.shouldSkip
    ? (logDebateFallback({ phase: 'final_moderator', reason: 'budget_exhausted' }), fallbackVerdict)
    : await createFinalVerdict({
      idea: input.idea,
      context,
      round1,
      round2,
      webEvidence,
      deadlineAt: finalPhase.deadlineAt,
      remainingMs: finalPhase.remaining,
    });

  const fallbackAgentIds = [...new Set([...round1, ...round2]
    .filter((result) => result.status === 'fallback')
    .map((result) => result.agentId))];
  const verdictResult = VerdictResultSchema.parse(verdict);

  return DebateResponseSchema.parse({
    context,
    round1,
    round2,
    verdict: verdictResult,
    metadata: {
      durationMs: Math.min(deadlineMs, Math.max(0, Date.now() - startTime)),
      deadlineMs: DEADLINE_MS,
      partial: initialContext.status === 'fallback'
        || fallbackAgentIds.length > 0
        || verdictResult.status === 'fallback',
      usedFallbackAgentIds: fallbackAgentIds,
      webEvidence: {
        requested: webEvidence.requested,
        status: webEvidence.status,
        citationCount: webEvidence.citations.length,
      },
    },
  });
}
