'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import DebateTimeline from '@/components/DebateTimeline';
import VerdictPanel from '@/components/VerdictPanel';

const PHASES = [
  'El moderador está ordenando los supuestos de la idea',
  'El consejo está construyendo sus posturas iniciales',
  'Los especialistas están contrastando evidencia',
  'El moderador está preparando el veredicto',
];

function shorten(text, length = 116) {
  return text.length > length ? `${text.slice(0, length).trim()}…` : text;
}

function ContextStrip({ context }) {
  if (!context) return null;

  return (
    <section className="mt-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/45 p-4 sm:grid-cols-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Problema</p>
        <p className="mt-1 text-sm leading-5 text-slate-300">{shorten(context.problem)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Usuario prioritario</p>
        <p className="mt-1 text-sm leading-5 text-slate-300">{shorten(context.targetUsers)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Supuestos por probar</p>
        <p className="mt-1 text-sm leading-5 text-slate-300">{context.keyAssumptions.slice(0, 2).join(' · ')}</p>
      </div>
    </section>
  );
}

export default function DebatePage() {
  const [input, setInput] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [visibleRound1, setVisibleRound1] = useState(0);
  const [visibleRound2, setVisibleRound2] = useState(0);
  const [showVerdict, setShowVerdict] = useState(false);

  useEffect(() => {
    const savedInput = window.sessionStorage.getItem('contraria-pending-debate');
    if (!savedInput) {
      const savedDebate = window.sessionStorage.getItem('contraria-last-debate');
      if (savedDebate) {
        try {
          const parsed = JSON.parse(savedDebate);
          setInput(parsed.input);
          setData(parsed.data);
          setVisibleRound1(5);
          setVisibleRound2(5);
          setShowVerdict(true);
          return undefined;
        } catch {
          window.sessionStorage.removeItem('contraria-last-debate');
        }
      }
      return undefined;
    }

    let active = true;
    const timers = [];
    let phaseTimer;
    const controller = new AbortController();

    try {
      const parsed = JSON.parse(savedInput);
      setInput(parsed);

      phaseTimer = window.setInterval(() => {
        if (active) setPhaseIndex((current) => Math.min(current + 1, PHASES.length - 1));
      }, 4500);

      fetch('/api/debate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = await response.json();
          if (!response.ok) throw new Error(body.error || 'No fue posible iniciar el debate.');
          return body;
        })
        .then((response) => {
          if (!active) return;
          window.clearInterval(phaseTimer);
          setPhaseIndex(PHASES.length - 1);
          setData(response);
          window.sessionStorage.removeItem('contraria-pending-debate');
          window.sessionStorage.setItem('contraria-last-debate', JSON.stringify({ input: parsed, data: response }));

          response.round1.forEach((_, index) => {
            timers.push(window.setTimeout(() => {
              if (active) setVisibleRound1(index + 1);
            }, 350 + (index * 500)));
          });

          const secondRoundStart = 350 + (response.round1.length * 500) + 900;
          response.round2.forEach((_, index) => {
            timers.push(window.setTimeout(() => {
              if (active) setVisibleRound2(index + 1);
            }, secondRoundStart + (index * 500)));
          });

          timers.push(window.setTimeout(() => {
            if (active) setShowVerdict(true);
          }, secondRoundStart + (response.round2.length * 500) + 700));
        })
        .catch((requestError) => {
          if (active && requestError.name !== 'AbortError') {
            setError(requestError.message || 'No fue posible iniciar el debate.');
          }
        });
    } catch {
      setError('No se pudo recuperar la idea para el debate.');
    }

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(phaseTimer);
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const isLoading = Boolean(input && !data && !error);
  const progress = data ? Math.min(100, 10 + ((visibleRound1 + visibleRound2) / 10) * 78 + (showVerdict ? 12 : 0)) : 14 + (phaseIndex * 16);

  if (!input && !error) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <section className="max-w-md rounded-3xl border border-slate-700 bg-slate-950/70 p-8 text-center shadow-2xl shadow-indigo-950/20">
          <p className="text-sm font-semibold text-white">No hay un debate abierto</p>
          <p className="mt-3 text-sm leading-6 text-slate-400">Vuelve al inicio, presenta una idea y el consejo aparecerá aquí.</p>
          <Link className="mt-6 inline-flex rounded-lg bg-indigo-400 px-4 py-2.5 text-sm font-bold text-slate-950" href="/">Preparar una idea</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-5 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <Link className="flex items-center gap-3 transition hover:opacity-85" href="/">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-300/30 bg-indigo-400/10 text-sm font-black text-indigo-200">C</span>
            <span><span className="block text-sm font-semibold text-white">ContrarIA</span><span className="block text-xs text-slate-500">Consejo de debate</span></span>
          </Link>
          <Link className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-indigo-400 hover:text-white" href="/">Nueva idea</Link>
        </header>

        {error ? (
          <section className="mx-auto mt-20 max-w-lg rounded-3xl border border-rose-400/25 bg-slate-950/80 p-7 text-center">
            <p className="text-lg font-bold text-white">El consejo no pudo iniciar</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{error}</p>
            <Link className="mt-6 inline-flex rounded-lg bg-indigo-400 px-4 py-2.5 text-sm font-bold text-slate-950" href="/">Intentar con otra idea</Link>
          </section>
        ) : (
          <>
            <section className="pt-10 sm:pt-14">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Sesión de debate</p>
                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">{shorten(input.idea, 145)}</h1>
                </div>
                <div className="min-w-48 rounded-xl border border-slate-800 bg-slate-900/55 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-slate-500">Progreso del consejo</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-indigo-400 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
                  <p className="mt-2 text-xs text-slate-400">{data ? (showVerdict ? 'Veredicto preparado' : 'Revelando el debate') : PHASES[phaseIndex]}</p>
                </div>
              </div>
              <ContextStrip context={data?.context} />
            </section>

            <DebateTimeline
              data={data}
              loading={isLoading}
              stage={PHASES[phaseIndex]}
              visibleRound1={visibleRound1}
              visibleRound2={visibleRound2}
            />

            {showVerdict && data ? <VerdictPanel metadata={data.metadata} report={{ input, debate: data }} verdict={data.verdict} /> : null}
          </>
        )}
      </div>
    </main>
  );
}
