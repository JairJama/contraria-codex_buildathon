import AgentCard, { AgentPlaceholder } from './AgentCard';

const AGENTS = [
  { id: 'strategy', name: 'Estrategia', role: 'Estratega de negocio' },
  { id: 'technology', name: 'Tecnología', role: 'Viabilidad técnica' },
  { id: 'ux', name: 'UX', role: 'Experiencia de usuario' },
  { id: 'risk', name: 'Riesgo', role: 'Analista de riesgos' },
  { id: 'critic', name: 'Crítico', role: 'Abogado del diablo' },
];

function PhaseHeader({ eyebrow, title, description, count }) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <span className="w-fit rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-400">{Math.min(count, 5)} de 5 voces</span>
    </header>
  );
}

function AgentSequence({ results, previousResults, visibleCount, loading, stage, phase }) {
  return (
    <div className="relative mt-5 space-y-4 before:absolute before:bottom-6 before:left-[1.05rem] before:top-6 before:w-px before:bg-slate-800 sm:before:left-[1.35rem]">
      {AGENTS.map((agent, index) => {
        const result = results?.find((item) => item.agentId === agent.id);
        const previousResult = previousResults?.find((item) => item.agentId === agent.id);
        const isVisible = index < visibleCount && result;

        return (
          <div className="relative pl-9 sm:pl-12" key={`${phase}-${agent.id}`}>
            <span className="absolute left-0 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-950 text-[10px] font-bold text-slate-500 sm:left-1">{String(index + 1).padStart(2, '0')}</span>
            {isVisible ? (
              <AgentCard phase={phase} previousResult={previousResult} result={result} />
            ) : (
              <AgentPlaceholder
                agent={agent}
                phase={phase}
                stage={loading ? stage : phase === 'reply' && visibleCount === 0 ? 'Esperando el contraste cruzado' : 'Listo para revelar'}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DebateTimeline({ data, visibleRound1, visibleRound2, loading, stage }) {
  const hasInitialRound = visibleRound1 >= 5;

  return (
    <section className="mt-10 space-y-12">
      <section className="scroll-mt-28" id="ronda-inicial">
        <PhaseHeader
          count={visibleRound1}
          description="Cada especialista analiza la idea desde su propio criterio. Esta es la lectura inicial, antes de conocer las objeciones del resto del consejo."
          eyebrow="Ronda 1 · Lectura inicial"
          title="Cinco perspectivas sobre la mesa"
        />
        <AgentSequence
          loading={loading}
          phase="initial"
          results={data?.round1}
          stage={stage}
          visibleCount={visibleRound1}
        />
      </section>

      <section aria-live="polite" className="rounded-3xl border border-indigo-400/20 bg-indigo-400/[0.06] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/25 bg-indigo-400/10 text-lg text-indigo-200">↔</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">El momento de contraste</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {hasInitialRound
                ? 'El consejo comparte las posturas iniciales. Ahora cada especialista responde a las objeciones que pueden cambiar el resultado.'
                : 'Las posturas iniciales se comparten antes de abrir la fase de réplicas cruzadas.'}
            </p>
          </div>
        </div>
      </section>

      <section className="scroll-mt-28" id="replicas">
        <PhaseHeader
          count={visibleRound2}
          description="Aquí se ve qué argumentos resistieron el contraste, qué objeciones fueron relevantes y cuándo un especialista decidió revisar su puntuación."
          eyebrow="Ronda 2 · Contraste cruzado"
          title="Réplicas y cambios de postura"
        />
        <div className="scroll-mt-28" id="cambios">
          <AgentSequence
            loading={loading && visibleRound1 >= 5}
            phase="reply"
            previousResults={data?.round1}
            results={data?.round2}
            stage="Los especialistas contrastan las posturas del consejo"
            visibleCount={visibleRound2}
          />
        </div>
      </section>
    </section>
  );
}
