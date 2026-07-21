const SECTIONS = [
  ['01', 'Contexto', '#contexto'],
  ['02', 'Inicial', '#ronda-inicial'],
  ['03', 'Réplicas', '#replicas'],
  ['04', 'Cambios', '#cambios'],
  ['05', 'Veredicto', '#veredicto'],
  ['06', 'Riesgos', '#riesgos'],
  ['07', 'Plan 48h', '#plan-48h'],
];

export default function DebateNavigator() {
  return (
    <nav aria-label="Secciones del debate" className="sticky top-3 z-20 mt-5 overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-950/90 p-2 shadow-xl shadow-slate-950/30 backdrop-blur">
      <ol className="flex min-w-max items-center gap-1">
        {SECTIONS.map(([number, label, target]) => (
          <li key={target}>
            <a className="group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400" href={target}>
              <span className="font-mono text-[10px] text-slate-600 transition group-hover:text-indigo-300">{number}</span>
              {label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
