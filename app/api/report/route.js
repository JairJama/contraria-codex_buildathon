import { NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { z } from 'zod';
import DebateReportDocument from '@/lib/DebateReportDocument';
import { DebateRequestSchema, DebateResponseSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ReportRequestSchema = z.object({ input: DebateRequestSchema, debate: DebateResponseSchema });

export async function POST(request) {
  try {
    const parsed = ReportRequestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'El resultado del debate no tiene el formato esperado.' }, { status: 400 });

    const generatedAt = new Date();
    const pdf = await renderToBuffer(<DebateReportDocument input={parsed.data.input} debate={parsed.data.debate} generatedAt={generatedAt} />);
    const fileDate = generatedAt.toISOString().slice(0, 10);

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="reporte-contraria-${fileDate}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'No fue posible generar el reporte. Inténtalo nuevamente.' }, { status: 500 });
  }
}
