'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import preloadedCase from '@/data/preloaded-case.json';

const MIN_IDEA_LENGTH = 20;

export default function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState('');
  const [context, setContext] = useState('');
  const [error, setError] = useState('');

  const loadExample = () => {
    setIdea(preloadedCase.idea);
    setContext(preloadedCase.context);
    setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedIdea = idea.trim();

    if (normalizedIdea.length < MIN_IDEA_LENGTH) {
      setError('Cuéntanos un poco más: la idea necesita al menos 20 caracteres.');
      return;
    }

    setError('');
    window.sessionStorage.removeItem('contraria-last-debate');
    window.sessionStorage.setItem(
      'contraria-pending-debate',
      JSON.stringify({ idea: normalizedIdea, context: context.trim() }),
    );
    router.push('/debate');
  };

  return (
    <main className="relative min-h-screen overflow-hidden px-5 py-6 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(79,70,229,0.22),transparent_66%)]" />

      <div className="relative mx-auto max-w-6xl">
        <header className="flex items-center justify-between py-4 sm:py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-indigo-300/30 bg-indigo-400/10 text-lg font-black text-indigo-200">
              C
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-white">ContrarIA</p>
              <p className="text-xs text-slate-500">AI Debate Engine</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-300 sm:inline-flex">
            Consejo listo
          </span>
        </header>

        <section className="grid items-start gap-10 pb-10 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16 lg:pb-20 lg:pt-20">
          <div className="max-w-xl pt-2">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Decidir con contraste
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              No recibas una respuesta. <span className="text-indigo-300">Abre un debate.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
              Cinco especialistas examinan tu idea desde negocio, tecnología, experiencia de usuario, riesgo y crítica. Después, el consejo te entrega una decisión y el siguiente experimento.
            </p>

            <ol className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {[
                ['01', 'Presenta tu idea', 'Comparte el problema y el contexto.'],
                ['02', 'Observa el contraste', 'El consejo debate en dos rondas.'],
                ['03', 'Decide qué validar', 'Recibe un veredicto accionable.'],
              ].map(([number, title, description]) => (
                <li className="flex gap-3" key={number}>
                  <span className="mt-0.5 text-xs font-bold text-indigo-300">{number}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{title}</p>
                    <p className="mt-0.5 text-sm leading-5 text-slate-500">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <section className="rounded-[1.75rem] border border-slate-700/70 bg-slate-950/70 p-5 shadow-2xl shadow-indigo-950/20 backdrop-blur sm:p-8">
            <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-white">Pon una idea sobre la mesa</p>
                <p className="mt-1 text-sm text-slate-400">El consejo usará esta información como contexto común.</p>
              </div>
              <button
                className="rounded-lg border border-indigo-300/30 bg-indigo-400/10 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:border-indigo-300/60 hover:bg-indigo-400/20 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onClick={loadExample}
                type="button"
              >
                Usar caso MarAzul
              </button>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="text-sm font-medium text-slate-200">¿Qué quieres evaluar?</span>
                <textarea
                  className="mt-2 min-h-40 w-full resize-y rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10"
                  maxLength={2000}
                  onChange={(event) => setIdea(event.target.value)}
                  placeholder="Ej.: Una plataforma que ayuda a pescadores artesanales a decidir cuándo salir a pescar según clima, demanda y precio de mercado."
                  value={idea}
                />
                <span className="mt-1.5 flex justify-between text-xs text-slate-500">
                  <span>Describe el problema, propuesta o producto.</span>
                  <span>{idea.trim().length}/2000</span>
                </span>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-200">Contexto adicional <span className="font-normal text-slate-500">(opcional)</span></span>
                <textarea
                  className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3.5 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10"
                  maxLength={3000}
                  onChange={(event) => setContext(event.target.value)}
                  placeholder="Usuarios, mercado, restricciones, recursos disponibles o supuestos que quieras contrastar."
                  value={context}
                />
              </label>

              {error ? <p className="rounded-lg border border-rose-400/25 bg-rose-400/10 px-3 py-2 text-sm text-rose-200" role="alert">{error}</p> : null}

              <button
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-indigo-300 focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
                type="submit"
              >
                Iniciar debate
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-slate-500">
              5 especialistas + 1 moderador · Dos rondas de contraste · Veredicto en minutos
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}
