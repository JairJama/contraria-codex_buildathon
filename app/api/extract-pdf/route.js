import { NextResponse } from 'next/server';
import { extractPdfContext, MAX_PDF_BYTES, PdfContextError } from '@/lib/pdfContext';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function hasPdfSignature(bytes) {
  const header = new TextDecoder('latin1').decode(bytes.slice(0, 1_024));
  return header.includes('%PDF-');
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function' || !String(file.name || '').toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Adjunta un archivo PDF v\u00e1lido.' }, { status: 400 });
    }

    if (!file.size || file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: 'El PDF debe pesar como m\u00e1ximo 4 MB.' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (!hasPdfSignature(bytes)) {
      return NextResponse.json({ error: 'El archivo no tiene un formato PDF v\u00e1lido.' }, { status: 400 });
    }

    const document = await extractPdfContext(bytes);
    return NextResponse.json({
      document: {
        name: String(file.name).slice(0, 120),
        pages: document.pages,
        excerpt: document.excerpt,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof PdfContextError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error(JSON.stringify({ event: 'pdf_extraction_failed', reason: 'unexpected_error' }));
    return NextResponse.json({ error: 'No fue posible procesar el PDF. Int\u00e9ntalo con otro archivo.' }, { status: 500 });
  }
}
