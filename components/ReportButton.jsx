'use client';

import { useState } from 'react';

export default function ReportButton({ input, debate }) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  async function downloadReport() {
    setStatus('loading');
    setError('');
    try {
      const response = await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ input, debate }) });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || 'No fue posible generar el reporte.');
      }
      const url = window.URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'reporte-contraria.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus('done');
    } catch (requestError) {
      setError(requestError.message || 'No fue posible generar el reporte.');
      setStatus('idle');
    }
  }

  return <div className="text-left lg:text-right"><button className="inline-flex min-h-10 items-center justify-center rounded-lg border border-indigo-300/40 bg-indigo-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-indigo-300 disabled:cursor-wait disabled:opacity-70" disabled={status === 'loading'} onClick={downloadReport} type="button">{status === 'loading' ? 'Generando PDF…' : 'Descargar reporte PDF'}</button>{status === 'done' ? <p className="mt-2 text-xs text-emerald-300">Reporte descargado.</p> : null}{error ? <p className="mt-2 max-w-xs text-xs leading-5 text-rose-300" role="alert">{error}</p> : null}</div>;
}
