'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  ['01', 'Contexto', 'contexto'],
  ['02', 'Inicial', 'ronda-inicial'],
  ['03', 'Réplicas', 'replicas'],
  ['04', 'Cambios', 'cambios'],
  ['05', 'Veredicto', 'veredicto'],
  ['06', 'Riesgos', 'riesgos'],
];

export default function DebateNavigator() {
  const [activeId, setActiveId] = useState('contexto');

  useEffect(() => {
    const findActiveSection = () => {
      const sectionElements = SECTIONS
        .map(([, , id]) => document.getElementById(id))
        .filter(Boolean);
      const offset = 170;
      const current = sectionElements
        .filter((element) => element.getBoundingClientRect().top <= offset)
        .at(-1);

      setActiveId(current?.id || sectionElements[0]?.id || 'contexto');
    };

    findActiveSection();
    window.addEventListener('scroll', findActiveSection, { passive: true });
    window.addEventListener('resize', findActiveSection);

    return () => {
      window.removeEventListener('scroll', findActiveSection);
      window.removeEventListener('resize', findActiveSection);
    };
  }, []);

  return (
    <nav aria-label="Secciones del debate" className="sticky top-3 z-20 mt-5 overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-950/90 p-2 shadow-xl shadow-slate-950/30 backdrop-blur">
      <ol className="flex min-w-max items-center gap-1">
        {SECTIONS.map(([number, label, id]) => {
          const isActive = activeId === id;

          return (
            <li key={id}>
              <a
                aria-current={isActive ? 'step' : undefined}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive ? 'bg-indigo-400 text-slate-950 shadow-sm shadow-indigo-400/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                href={`#${id}`}
              >
                <span className={`font-mono text-[10px] ${isActive ? 'text-indigo-950/65' : 'text-slate-600 group-hover:text-indigo-300'}`}>{number}</span>
                {label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
