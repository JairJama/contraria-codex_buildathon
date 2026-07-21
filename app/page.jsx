export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-slate-700/70 bg-slate-950/70 p-8 shadow-2xl shadow-indigo-950/30 backdrop-blur sm:p-12">
        <p className="mb-6 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-medium text-emerald-300">
          Sistema disponible
        </p>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
          AI Debate Engine
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
          ContrarIA está en línea.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
          El consejo de especialistas se está preparando para contrastar ideas de negocio desde múltiples perspectivas.
        </p>
        <a
          className="mt-10 inline-flex rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-indigo-400 hover:bg-indigo-400/10"
          href="/api/health"
        >
          Verificar estado del servicio
        </a>
      </section>
    </main>
  );
}
