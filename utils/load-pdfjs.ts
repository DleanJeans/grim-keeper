/** Loads PDF.js with its parser on the page thread, so the app needs no separate worker file. */
export async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const globals = globalThis as typeof globalThis & { pdfjsWorker?: unknown };

  if (!globals.pdfjsWorker) {
    globals.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  }

  return pdfjs;
}
