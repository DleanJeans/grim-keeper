/**
 * PDF.js can't be bundled for Android or iOS: Hermes rejects its runtime `import()` calls, which
 * fails the whole native build. PDF import stays a web feature.
 */
export async function loadPdfjs(): Promise<typeof import('pdfjs-dist/legacy/build/pdf.mjs')> {
  throw new Error(
    'Reading a PDF only works in the web app. Paste the script JSON or upload an image instead.',
  );
}
