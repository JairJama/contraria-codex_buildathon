import ReportButton from './ReportButton';

const DECISIONS = {
  advance: { label: 'Avanzar', className: 'border-emerald-400/35 bg-emerald-400/10 text-emerald-200', accent: 'text-emerald-300' },
  pivot: { label: 'Pivotar', className: 'border-amber-400/35 bg-amber-400/10 text-amber-200', accent: 'text-amber-300' },
  discard: { label: 'Descartar', className: 'border-rose-400/35 bg-rose-400/10 text-rose-200', accent: 'text-rose-300' },
};

const CONFIDENCE = { low: 'Baja', medium: 'Media', high: 'Alta' };

function sourceHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function RiskItem({ item, index }) {
  const severity = item.probability * item.impact;
  const tone = severity >= 16 ? 'bg-rose-400' : severity >= 9 ? 'bg-amber-400' : 'bg-sky-400';

  return (
    <li className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold leading-6 text-slate-200">{item.risk}</p>
        <span className="shrink-0 text-xs text-slate-500">#{index + 1}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${tone}`} />
        <span className="text-xs text-slate-400">Prob. {item.probability}/5 · Impacto {item.impact}/5</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400"><span className="font-medium text-slate-300">Mitigación:</span> {item.mitigation}</p>
    </li>
  );
}

export default function VerdictPanel({ verdict, metadata, report }) {
  const decision = DECISIONS[verdict.decision] || DECISIONS.pivot;

  return (
    <section className="animate-card-in mt-10 scroll-mt-28 rounded-3xl border border-slate-700/80 bg-slate-950/75 p-5 shadow-2xl shadow-indigo-950/20 sm:p-7" id="veredicto">
      <div className="flex flex-col gap-6 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Veredicto del consejo</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1.5 text-sm font-bold ${decision.className}`}>{decision.label}</span>
            <span className="text-sm text-slate-400">Confianza {CONFIDENCE[verdict.confidence] || verdict.confidence}</span>
          </div>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{verdict.rationale}</p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-5 py-4 text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Puntuación global</p>
          <p className={`mt-1 text-4xl font-bold tracking-tight ${decision.accent}`}>{verdict.overallScore.toFixed(1)}<span className="text-lg text-slate-500">/10</span></p>
          </div>
          {report ? <ReportButton input={report.input} debate={report.debate} /> : null}
        </div>
      </div>

      <div className="grid gap-5 py-7 lg:grid-cols-2">
        <section className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.035] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-emerald-200">El caso a favor</h3>
          <ul className="mt-3 space-y-3">
            {verdict.pros.map((item, index) => <li className="flex gap-3 text-sm leading-7 text-slate-300" key={`${item}-${index}`}><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />{item}</li>)}
          </ul>
        </section>
        <section className="rounded-2xl border border-rose-400/15 bg-rose-400/[0.035] p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-rose-200">Lo que puede romper la idea</h3>
          <ul className="mt-3 space-y-3">
            {verdict.cons.map((item, index) => <li className="flex gap-3 text-sm leading-7 text-slate-300" key={`${item}-${index}`}><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />{item}</li>)}
          </ul>
        </section>
      </div>

      {verdict.citations?.length ? (
        <section className="border-t border-slate-800 py-6" aria-labelledby="sources-title">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Evidencia externa</p>
          <h3 className="mt-1 text-lg font-bold text-white" id="sources-title">Fuentes que informaron el veredicto</h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {verdict.citations.slice(0, 2).map((citation) => (
              <li key={citation.url}>
                <a className="block rounded-xl border border-slate-800 bg-slate-900/45 p-4 transition hover:border-indigo-400/55 hover:bg-slate-900" href={citation.url} rel="noreferrer" target="_blank">
                  <span className="text-xs font-bold text-indigo-300">[{citation.id}]</span>
                  <span className="mt-1 block text-sm font-semibold leading-5 text-slate-200">{citation.title}</span>
                  <span className="mt-2 block truncate text-xs text-slate-500">{sourceHost(citation.url)} ↗</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="scroll-mt-28 border-t border-slate-800 pt-6" id="riesgos">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Atención prioritaria</p>
              <h3 className="mt-1 text-lg font-bold text-white">Riesgos que debes vigilar</h3>
            </div>
            <span className="text-xs text-slate-500">Probabilidad × impacto</span>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {verdict.prioritizedRisks.slice(0, 3).map((item, index) => <RiskItem index={index} item={item} key={`${item.risk}-${index}`} />)}
          </ol>
      </section>

      {metadata?.partial ? <p className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">El consejo completó este resultado con una o más respuestas de respaldo por tiempo o disponibilidad del proveedor.</p> : null}
    </section>
  );
}
