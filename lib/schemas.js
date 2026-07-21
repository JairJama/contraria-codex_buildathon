import { z } from 'zod';

const ShortText = z.string().trim().min(1).max(500);
const LongText = z.string().trim().min(1).max(2_000);

export const DebateRequestSchema = z.object({
  idea: z.string().trim().min(20).max(2_000),
  context: z.string().trim().max(3_000).optional().default(''),
  useWebEvidence: z.boolean().optional().default(false),
});

export const DebateContextSchema = z.object({
  problem: ShortText,
  targetUsers: ShortText,
  valueProposition: ShortText,
  keyAssumptions: z.array(ShortText).min(2).max(5),
  evaluationCriteria: z.array(ShortText).min(3).max(5),
  unknowns: z.array(ShortText).min(1).max(4),
});

export const AgentIdSchema = z.enum([
  'strategy',
  'technology',
  'ux',
  'risk',
  'critic',
]);

export const RecommendationSchema = z.enum(['advance', 'pivot', 'discard']);
export const StanceSchema = z.enum(['support', 'caution', 'oppose']);
export const FallbackReasonSchema = z.enum([
  'timeout',
  'api_error',
  'invalid_response',
  'budget_exhausted',
  'configuration',
]);

const RiskSchema = z.object({
  risk: ShortText,
  probability: z.number().int().min(1).max(5),
  impact: z.number().int().min(1).max(5),
  mitigation: ShortText,
});

export const AgentPositionSchema = z.object({
  stance: StanceSchema,
  score: z.number().min(1).max(10),
  summary: LongText,
  arguments: z.array(z.object({
    claim: ShortText,
    reason: ShortText,
  })).min(2).max(3),
  risks: z.array(RiskSchema).min(1).max(3),
  recommendation: RecommendationSchema,
  changedPosition: z.boolean(),
  changeReason: ShortText.nullable(),
  responseTo: z.array(AgentIdSchema).max(3),
});

export const AgentResultSchema = AgentPositionSchema.extend({
  agentId: AgentIdSchema,
  agentName: ShortText,
  role: ShortText,
  round: z.union([z.literal(1), z.literal(2)]),
  status: z.enum(['complete', 'fallback']),
  fallbackReason: FallbackReasonSchema.nullable(),
});

export const VerdictSchema = z.object({
  decision: RecommendationSchema,
  overallScore: z.number().min(1).max(10),
  confidence: z.enum(['low', 'medium', 'high']),
  rationale: LongText,
  pros: z.array(ShortText).min(2).max(4),
  cons: z.array(ShortText).min(2).max(4),
  prioritizedRisks: z.array(RiskSchema).min(1).max(3),
  experiment: z.object({
    hypothesis: ShortText,
    action: ShortText,
    successMetric: ShortText,
    timeboxHours: z.literal(48),
  }),
});

export const WebCitationSchema = z.object({
  id: z.enum(['S1', 'S2']),
  title: ShortText,
  url: z.string().url().max(2_000),
});

export const VerdictResultSchema = VerdictSchema.extend({
  status: z.enum(['complete', 'fallback']),
  fallbackReason: FallbackReasonSchema.nullable(),
  citations: z.array(WebCitationSchema).max(2).optional().default([]),
});

export const DebateResponseSchema = z.object({
  context: DebateContextSchema,
  round1: z.array(AgentResultSchema).length(5),
  round2: z.array(AgentResultSchema).length(5),
  verdict: VerdictResultSchema,
  metadata: z.object({
    durationMs: z.number().int().nonnegative(),
    deadlineMs: z.literal(55_000),
    partial: z.boolean(),
    usedFallbackAgentIds: z.array(AgentIdSchema),
    webEvidence: z.object({
      requested: z.boolean(),
      status: z.enum(['not_requested', 'complete', 'fallback']),
      citationCount: z.number().int().min(0).max(2),
    }).optional().default({
      requested: false,
      status: 'not_requested',
      citationCount: 0,
    }),
  }),
});
