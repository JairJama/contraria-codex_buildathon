import AgentCard, { AgentPlaceholder } from './AgentCard';

const AGENTS = [
  { id: 'strategy', name: 'Estrategia', role: 'Estratega de negocio' },
  { id: 'technology', name: 'Tecnología', role: 'Viabilidad técnica' },
  { id: 'ux', name: 'UX', role: 'Experiencia de usuario' },
  { id: 'risk', name: 'Riesgo', role: 'Analista de riesgos' },
  { id: 'critic', name: 'Crítico', role: 'Abogado del diablo' },
];

function RoundColumn({ title, subtitle, round, results, previousResults, visibleCount, loading, stage }) {
  return (
    <section className="min-w-0 rounded-3xl border border-slate-800/90 bg-slate-900/35 p-4 sm:p-5">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-300">{title}</p>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs font-semibold text-slate-400">
          {Math.min(visibleCount, 5)}/5
        </span>
      </header>

      <div className="space-y-3">
        {AGENTS.map((agent, index) => {
          const result = results?.find((item) => item.agentId === agent.id);
          const previousResult = previousResults?.find((item) => item.agentId === agent.id);
          const isVisible = index < visibleCount && result;

          return isVisible ? (
            <AgentCard key={`${round}-${agent.id}`} previousResult={previousResult} result={result} />
          ) : (
            <AgentPlaceholder
              agent={agent}
              key={`${round}-${agent.id}`}
              stage={loading ? stage : round === 2 && visibleCount === 0 ? 'Esperando la ronda 2' : 'Listo para revelar'}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function DebateTimeline({ data, visibleRound1, visibleRound2, loading, stage }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">El intercambio</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Dos rondas para poner a prueba la idea</h2>
        </div>
        <p className="text-sm text-slate-500">Las respuestas se revelan en el orden del debate.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <RoundColumn
          loading={loading}
          results={data?.round1}
          round={1}
          stage={stage}
          subtitle="Posturas iniciales"
          title="Ronda 1"
          visibleCount={visibleRound1}
        />
        <RoundColumn
          loading={loading && visibleRound1 >= 5}
          previousResults={data?.round1}
          results={data?.round2}
          round={2}
          stage="Los agentes contrastan sus posturas"
          subtitle="Réplicas y revisión de criterio"
          title="Ronda 2"
          visibleCount={visibleRound2}
        />
      </div>
    </section>
  );
}
