import { extractText, getDocumentProxy } from 'unpdf';

export const MAX_PDF_BYTES = 4 * 1024 * 1024;
export const MAX_PDF_PAGES = 10;
export const MAX_EXCERPT_LENGTH = 1_800;

const RELEVANT_TERMS = [
  'problema', 'necesidad', 'usuario', 'cliente', 'mercado', 'segmento',
  'propuesta', 'valor', 'competencia', 'precio', 'costo', 'ingreso',
  'modelo', 'piloto', 'evidencia', 'encuesta', 'entrevista', 'demanda',
  'riesgo', 'legal', 'operativo', 'tecnologia', 'tecnica', 'dato', 'impacto',
];

export class PdfContextError extends Error {}

function normalizeText(value) {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitIntoChunks(text, page) {
  const chunks = [];
  let remaining = text;

  while (remaining.length) {
    let end = Math.min(520, remaining.length);
    if (end < remaining.length) {
      const lastSpace = remaining.lastIndexOf(' ', end);
      if (lastSpace > 220) end = lastSpace;
    }

    const content = remaining.slice(0, end).trim();
    if (content) chunks.push({ page, content });
    remaining = remaining.slice(end).trim();
  }

  return chunks;
}

function relevanceScore(content) {
  const normalized = content.toLocaleLowerCase('es');
  const keywordMatches = RELEVANT_TERMS.reduce(
    (total, term) => total + (normalized.includes(term) ? 1 : 0),
    0,
  );
  const evidenceSignals = (content.match(/\d|\$|%/g) || []).length;
  return (keywordMatches * 4) + Math.min(evidenceSignals, 4);
}

function selectUsefulExcerpt(pages) {
  const candidates = pages.flatMap((text, index) => splitIntoChunks(normalizeText(text), index + 1))
    .filter((chunk) => chunk.content.length >= 40)
    .map((chunk, index) => ({ ...chunk, index, score: relevanceScore(chunk.content) }));

  const selected = candidates
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 6)
    .sort((a, b) => a.page - b.page || a.index - b.index);

  const excerpt = [];
  let length = 0;

  for (const chunk of selected) {
    const labeled = `[P\u00e1gina ${chunk.page}] ${chunk.content}`;
    const remaining = MAX_EXCERPT_LENGTH - length;
    if (remaining < 80) break;
    excerpt.push(labeled.slice(0, remaining));
    length += Math.min(labeled.length, remaining) + 1;
  }

  return excerpt.join('\n');
}

export async function extractPdfContext(bytes) {
  let pdf;

  try {
    pdf = await getDocumentProxy(bytes);
    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new PdfContextError(`El PDF tiene ${pdf.numPages} p\u00e1ginas. El l\u00edmite es ${MAX_PDF_PAGES}.`);
    }

    const { text, totalPages } = await extractText(pdf);
    const excerpt = selectUsefulExcerpt(text);

    if (excerpt.length < 160) {
      throw new PdfContextError('No se encontr\u00f3 suficiente texto seleccionable. Usa un PDF con texto, no una imagen escaneada.');
    }

    return { excerpt, pages: totalPages };
  } catch (error) {
    if (error instanceof PdfContextError) throw error;
    throw new PdfContextError('No fue posible leer este PDF. Verifica que el archivo no est\u00e9 protegido o da\u00f1ado.');
  } finally {
    await pdf?.destroy?.();
  }
}
