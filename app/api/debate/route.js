import { NextResponse } from 'next/server';
import { runDebate, DEADLINE_MS } from '@/lib/orchestrator';
import { DebateRequestSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const startTime = Date.now();

  try {
    const payload = await request.json();
    const parsed = DebateRequestSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({
        error: 'La idea debe tener entre 20 y 2000 caracteres.',
      }, { status: 400 });
    }

    const debate = await runDebate(parsed.data, {
      startTime,
      deadlineMs: DEADLINE_MS,
    });

    return NextResponse.json(debate, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch {
    return NextResponse.json({
      error: 'No fue posible iniciar el debate. Inténtalo nuevamente.',
    }, { status: 500 });
  }
}
