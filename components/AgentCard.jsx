'use client';

const AGENT_STYLES = {
  strategy: { mark: 'E', color: 'border-violet-400/35 bg-violet-400/10 text-violet-200', dot: 'bg-violet-400' },
  technology: { mark: 'T', color: 'border-sky-400/35 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  ux: { mark: 'U', color: 'border-teal-400/35 bg-teal-400/10 text-teal-200', dot: 'bg-teal-400' },
  risk: { mark: 'R', color: 'border-amber-400/35 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  critic: { mark: 'C', color: 'border-rose-400/35 bg-rose-400/10 text-rose-200', dot: 'bg-rose-400' },
};

const STANCE_LABELS = {
  support: 'A favor',
  caution: 'Con reservas',
  oppose: 'En contra',
};

const RECOMMENDATION_LABELS = {
  advance: 'Avanzar',
  pivot: 'Pivotar',
  discard: 'Descartar',
};

function scoreTone(score) {
  if (score >= 7) return 'text-emerald-300';
  if (score >= 4) return 'text-amber-300';
  return 'text-rose-300';
}

export function AgentPlaceholder({ agent, stage }) {
  const style = AGENT_STYLES[agent.id] || AGENT_STYLES.strategy;

  return (
    <article className="min-h-52 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 opacity-75">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${style.color} text-xs font-bold`}>{style.mark}</div>
        <div>
          <p className="text-sm font-semibold text-slate-300">{agent.name}</p>
          <p className="text-xs text-slate-600">{agent.role}</p>
        </div>
      </div>
      <div className="mt-7 flex items-center gap-2 text-xs text-slate-500">
        <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${style.dot}`} />
        {stage}
      </div>
      <div className="mt-5 h-2 w-full animate-pulse rounded bg-slate-800" />
      <div className="mt-3 h-2 w-4/5 animate-pulse rounded bg-slate-800" />
    </article>
  );
}

export default function AgentCard({ result, previousResult }) {
  const style = AGENT_STYLES[result.agentId] || AGENT_STYLES.strategy;
  const hasScoreChange = previousResult && Math.abs(previousResult.score - result.score) >= 0.1;
  const respondedTo = result.responseTo?.length
    ? `Respondió a ${result.responseTo.length} ${result.responseTo.length === 1 ? 'agente' : 'agentes'}`
    : null;

  return (
    <article className="animate-card-in rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 shadow-lg shadow-slate-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${style.color}`}>{style.mark}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{result.agentName}</p>
            <p className="truncate text-xs text-slate-500">{result.role}</p>
          </div>
        </div>
        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${style.color}`}>
          {STANCE_LABELS[result.stance] || result.stance}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Puntuación</p>
          <div className="mt-1 flex items-baseline gap-1.5">
            {hasScoreChange ? <span className="text-sm text-slate-600 line-through">{previousResult.score.toFixed(1)}</span> : null}
            <span className={`text-2xl font-bold tracking-tight ${scoreTone(result.score)}`}>{result.score.toFixed(1)}</span>
            <span className="text-xs text-slate-500">/10</span>
          </div>
        </div>
        <span className="text-right text-xs font-medium text-slate-400">{RECOMMENDATION_LABELS[result.recommendation] || result.recommendation}</span>
      </div>

      {result.changedPosition ? (
        <p className="mt-4 rounded-lg border border-indigo-400/25 bg-indigo-400/10 px-3 py-2 text-xs leading-5 text-indigo-100">
          <span className="font-semibold">Cambio de criterio. </span>{result.changeReason || 'La evidencia cruzada modificó su evaluación.'}
        </p>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-slate-300">{result.summary}</p>

      <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
        {result.arguments?.slice(0, 2).map((argument, index) => (
          <div className="flex gap-2" key={`${argument.claim}-${index}`}>
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
            <p className="text-xs leading-5 text-slate-400"><span className="font-semibold text-slate-300">{argument.claim}:</span> {argument.reason}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px]">
        {respondedTo ? <span className="rounded-md bg-slate-800 px-2 py-1 text-slate-400">{respondedTo}</span> : null}
        {result.status === 'fallback' ? <span className="rounded-md bg-amber-400/10 px-2 py-1 text-amber-200">Respuesta de respaldo</span> : null}
      </div>
    </article>
  );
}
