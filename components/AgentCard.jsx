const AGENT_STYLES = {
  strategy: { mark: 'E', color: 'border-violet-400/35 bg-violet-400/10 text-violet-200', dot: 'bg-violet-400' },
  technology: { mark: 'T', color: 'border-sky-400/35 bg-sky-400/10 text-sky-200', dot: 'bg-sky-400' },
  ux: { mark: 'U', color: 'border-teal-400/35 bg-teal-400/10 text-teal-200', dot: 'bg-teal-400' },
  risk: { mark: 'R', color: 'border-amber-400/35 bg-amber-400/10 text-amber-200', dot: 'bg-amber-400' },
  critic: { mark: 'C', color: 'border-rose-400/35 bg-rose-400/10 text-rose-200', dot: 'bg-rose-400' },
};

const STANCE_LABELS = { support: 'A favor', caution: 'Con reservas', oppose: 'En contra' };
const RECOMMENDATION_LABELS = { advance: 'Avanzar', pivot: 'Pivotar', discard: 'Descartar' };

function scoreTone(score) {
  if (score >= 7) return 'text-emerald-300';
  if (score >= 4) return 'text-amber-300';
  return 'text-rose-300';
}

function ScoreChange({ previousScore, score }) {
  const delta = score - previousScore;
  const unchanged = Math.abs(delta) < 0.1;
  const direction = delta > 0 ? 'Sube' : 'Baja';
  const tone = delta > 0 ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/25 bg-rose-400/10 text-rose-200';

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="rounded-xl border border-slate-800 bg-slate-900/65 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Antes</p>
        <p className="mt-1 text-xl font-bold text-slate-400">{previousScore.toFixed(1)}</p>
      </div>
      <span className="mb-3 text-lg text-slate-600">→</span>
      <div className="rounded-xl border border-indigo-400/25 bg-indigo-400/[0.07] px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-indigo-300">Después</p>
        <p className={`mt-1 text-xl font-bold ${scoreTone(score)}`}>{score.toFixed(1)}</p>
      </div>
      <span className={`mb-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${unchanged ? 'border-slate-700 bg-slate-800 text-slate-300' : tone}`}>
        {unchanged ? 'Sin cambio' : `${direction} ${Math.abs(delta).toFixed(1)}`}
      </span>
    </div>
  );
}

function ResponseTarget({ target }) {
  const style = AGENT_STYLES[target.agentId] || AGENT_STYLES.strategy;
  const point = target.arguments?.[0];
  const reference = point ? `${point.claim}. ${point.reason}` : target.summary;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/65 p-3">
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold ${style.color}`}>{style.mark}</span>
        <div>
          <p className="text-xs font-semibold text-slate-200">En respuesta a {target.agentName}</p>
          <p className="text-[10px] text-slate-500">Punto de la postura inicial</p>
        </div>
      </div>
      <p className="mt-3 border-l-2 border-slate-700 pl-3 text-xs leading-5 text-slate-400">{reference}</p>
    </article>
  );
}

function ArgumentGrid({ arguments: argumentsList, title }) {
  return (
    <section className="mt-5 border-t border-slate-800 pt-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {argumentsList?.slice(0, 2).map((argument, index) => (
          <div className="rounded-lg bg-slate-900/75 p-3" key={`${argument.claim}-${index}`}>
            <p className="text-xs font-semibold text-slate-300">{argument.claim}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{argument.reason}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AgentPlaceholder({ agent, stage, phase }) {
  const style = AGENT_STYLES[agent.id] || AGENT_STYLES.strategy;
  const label = phase === 'reply' ? 'Réplica pendiente' : 'Postura inicial pendiente';

  return (
    <article className="min-h-48 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 opacity-75">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${style.color} text-xs font-bold`}>{style.mark}</div>
        <div>
          <p className="text-sm font-semibold text-slate-300">{agent.name}</p>
          <p className="text-xs text-slate-600">{label}</p>
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${style.dot}`} />
        {stage}
      </div>
      <div className="mt-5 h-2 w-full animate-pulse rounded bg-slate-800" />
      <div className="mt-3 h-2 w-4/5 animate-pulse rounded bg-slate-800" />
    </article>
  );
}

export default function AgentCard({ result, previousResult, roundOneResults = [], phase = 'initial' }) {
  const style = AGENT_STYLES[result.agentId] || AGENT_STYLES.strategy;
  const isReply = phase === 'reply';
  const responseTargets = isReply
    ? (result.responseTo || [])
      .map((agentId) => roundOneResults.find((item) => item.agentId === agentId))
      .filter(Boolean)
    : [];

  return (
    <article className={`animate-card-in rounded-2xl border bg-slate-950/80 p-4 shadow-lg shadow-slate-950/20 sm:p-5 ${isReply ? 'border-indigo-400/25' : 'border-slate-700/80'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${style.color}`}>{style.mark}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{result.agentName}</p>
            <p className="truncate text-xs text-slate-500">{result.role}</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${style.color}`}>{STANCE_LABELS[result.stance] || result.stance}</span>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">{isReply ? 'Réplica cruzada' : 'Postura inicial'}</p>
        </div>
      </div>

      {isReply && previousResult ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/45 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">Revisión de postura</p>
            <div className="mt-3"><ScoreChange previousScore={previousResult.score} score={result.score} /></div>
            <div className="mt-5 border-l-2 border-indigo-400 pl-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-indigo-300">{result.changedPosition ? 'Por qué cambió' : 'Qué mantuvo'}</p>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">{result.changedPosition ? (result.changeReason || 'La evidencia cruzada modificó su evaluación.') : 'Tras revisar las objeciones, el especialista mantiene su criterio principal.'}</p>
            </div>
            <p className="mt-5 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">Recomendación revisada: <span className="font-semibold text-white">{RECOMMENDATION_LABELS[result.recommendation] || result.recommendation}</span></p>
          </aside>

          <section>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">Respuestas dirigidas</p>
                <p className="mt-1 text-sm text-slate-400">Estos son los puntos iniciales a los que hace referencia esta réplica.</p>
              </div>
              {responseTargets.length ? <span className="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-2.5 py-1 text-xs font-semibold text-indigo-200">{responseTargets.length} {responseTargets.length === 1 ? 'referencia' : 'referencias'}</span> : null}
            </div>

            <div className="mt-3 space-y-3">
              {responseTargets.length ? responseTargets.map((target) => <ResponseTarget key={target.agentId} target={target} />) : (
                <p className="rounded-xl border border-slate-800 bg-slate-900/45 px-3 py-4 text-sm leading-6 text-slate-400">Esta réplica revisa el debate de forma general, sin señalar una postura individual.</p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Puntuación inicial</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${scoreTone(result.score)}`}>{result.score.toFixed(1)}<span className="ml-1 text-xs font-medium text-slate-500">/10</span></p>
          </div>
          <span className="text-right text-xs font-medium text-slate-400">Propone: {RECOMMENDATION_LABELS[result.recommendation] || result.recommendation}</span>
        </div>
      )}

      <section className="mt-5 border-t border-slate-800 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{isReply ? 'Respuesta y conclusión revisada' : 'Conclusión inicial'}</p>
        <p className="mt-1.5 text-sm leading-6 text-slate-300">{result.summary}</p>
      </section>

      <ArgumentGrid arguments={result.arguments} title={isReply ? 'Argumentos que sostienen su réplica' : 'Argumentos de la postura inicial'} />

      {result.status === 'fallback' ? <p className="mt-4 inline-flex rounded-md bg-amber-400/10 px-2 py-1 text-[11px] text-amber-200">Respuesta de respaldo</p> : null}
    </article>
  );
}
