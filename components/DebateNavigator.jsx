'use client';

import { useEffect, useState } from 'react';

const SECTIONS = [
  ['01', 'Contexto', '#contexto'],
  ['02', 'Inicial', '#ronda-inicial'],
  ['03', 'Réplicas', '#replicas'],
  ['04', 'Cambios', '#cambios'],
  ['05', 'Veredicto', '#veredicto'],
  ['06', 'Riesgos', '#riesgos'],
];

export default function DebateNavigator() {
  const [activeTarget, setActiveTarget] = useState('#contexto');

  useEffect(() => {
    let frame;

    const updateActiveSection = () => {
      const readingLine = window.scrollY + 170;
      let nextTarget = SECTIONS[0][2];

      SECTIONS.forEach(([, , target]) => {
        const element = document.querySelector(target);
        if (element && element.getBoundingClientRect().top + window.scrollY <= readingLine) {
          nextTarget = target;
        }
      });

      setActiveTarget((current) => (current === nextTarget ? current : nextTarget));
    };

    const onScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <nav aria-label="Secciones del debate" className="sticky top-3 z-20 mt-5 overflow-x-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 p-1.5 shadow-xl shadow-slate-950/30 backdrop-blur">
      <ol className="flex min-w-max items-center gap-1">
        {SECTIONS.map(([number, label, target]) => {
          const isActive = activeTarget === target;

          return (
            <li key={target}>
              <a
                aria-current={isActive ? 'location' : undefined}
                className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${isActive ? 'bg-indigo-400/15 text-indigo-100 shadow-sm shadow-indigo-950/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                href={target}
                onClick={() => setActiveTarget(target)}
              >
                <span className={`font-mono text-[10px] transition ${isActive ? 'text-indigo-300' : 'text-slate-600 group-hover:text-indigo-300'}`}>{number}</span>
                <span>{label}</span>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full transition ${isActive ? 'bg-indigo-300 opacity-100' : 'bg-slate-700 opacity-0'}`} />
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
