import type { TextItem } from 'pdfjs-dist/types/src/display/api';

/** A run of text in one font and size, such as a character name or its ability. */
export type PdfTextSegment = {
  /** Font name and rounded size; missing for plain text without layout details. */
  style?: string;
  text: string;
};

export type PdfTextLine = PdfTextSegment[];

/** The parts of a PDF.js text item the line grouping reads. */
export type PdfTextItem = {
  fontName?: string;
  height: number;
  str: string;
  transform: number[];
  width: number;
};

/** Items whose baselines differ by less than this share of the text height are on one line. */
const SAME_LINE_TOLERANCE = 0.5;
/** A gap wider than this share of the text height starts a new segment in the same style. */
const SEGMENT_GAP = 1.5;

/** Reads the text of each page of a PDF, grouped into lines of styled segments. */
export async function extractPdfTextLines(data: ArrayBuffer): Promise<PdfTextLine[]> {
  const pdfjs = await loadPdfjs();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const lines: PdfTextLine[] = [];

  try {
    const document = await loadingTask.promise.catch((error: unknown) => {
      throw new Error(getPdfOpenErrorMessage(error));
    });

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items.filter((item): item is TextItem => 'str' in item);
      lines.push(...groupPdfTextItems(items));
    }
  } finally {
    await loadingTask.destroy();
  }

  return lines;
}

/** Groups positioned text items into top-to-bottom lines of left-to-right segments. */
export function groupPdfTextItems(items: PdfTextItem[]): PdfTextLine[] {
  const rows: { items: PdfTextItem[]; y: number; height: number }[] = [];
  const sortedItems = items
    .filter((item) => item.str.trim())
    .sort((first, second) => getY(second) - getY(first) || getX(first) - getX(second));

  for (const item of sortedItems) {
    const height = Math.max(item.height, 1);
    const row = rows.find(
      (candidate) =>
        Math.abs(candidate.y - getY(item)) <
        Math.max(candidate.height, height) * SAME_LINE_TOLERANCE,
    );

    if (row) {
      row.items.push(item);
    } else {
      rows.push({ height, items: [item], y: getY(item) });
    }
  }

  return rows
    .sort((first, second) => second.y - first.y)
    .map((row) => getRowSegments(row.items.sort((first, second) => getX(first) - getX(second))));
}

function getRowSegments(items: PdfTextItem[]): PdfTextLine {
  const segments: (PdfTextSegment & { end: number; height: number })[] = [];

  for (const item of items) {
    const style = `${item.fontName ?? ''}:${Math.round(item.height)}`;
    const previous = segments.at(-1);
    const gap = previous ? getX(item) - previous.end : 0;

    if (previous && previous.style === style && gap < previous.height * SEGMENT_GAP) {
      const separator = gap > item.height * 0.15 && !previous.text.endsWith(' ') ? ' ' : '';
      previous.text += `${separator}${item.str}`;
      previous.end = getX(item) + item.width;
    } else {
      segments.push({
        end: getX(item) + item.width,
        height: Math.max(item.height, 1),
        style,
        text: item.str,
      });
    }
  }

  return segments.map(({ style, text }) => ({ style, text: text.replace(/\s+/g, ' ').trim() }));
}

function getPdfOpenErrorMessage(error: unknown) {
  const name = error instanceof Error ? error.name : '';

  if (name === 'PasswordException') {
    return 'This PDF is password protected. Remove the password and try again.';
  }

  return 'The file could not be opened as a PDF.';
}

function getX(item: PdfTextItem) {
  return item.transform[4] ?? 0;
}

function getY(item: PdfTextItem) {
  return item.transform[5] ?? 0;
}

async function loadPdfjs() {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const globals = globalThis as typeof globalThis & { pdfjsWorker?: unknown };

  // Runs the parser on the page thread, so the app needs no separate worker file.
  if (!globals.pdfjsWorker) {
    globals.pdfjsWorker = await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
  }

  return pdfjs;
}
