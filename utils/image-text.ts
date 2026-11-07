import type { Role } from '@/types/game';
import { normalizeRoleName } from '@/utils/pdf-script-parser';
import type { PdfTextLine } from '@/utils/pdf-text';

/** A recognized word and where it starts across the image, in pixels. */
export type OcrWord = {
  text: string;
  x0: number;
};

/** Word starts within this many pixels of each other count as the same column. */
const COLUMN_TOLERANCE = 12;
/** A column needs this many lines starting a word in it to count as a table column. */
const MIN_COLUMN_LINES = 3;
/** Longest character name, in words. */
const MAX_NAME_WORDS = 3;
/** Segment styles for the name and ability columns, so the parser treats names like a PDF's. */
export const OCR_NAME_STYLE = 'ocr-name';
const OCR_ABILITY_STYLE = 'ocr-ability';

/**
 * Recognizes the text in a script image on the device. The recognizer and its English data are
 * downloaded on first use.
 */
export async function extractImageTextLines(image: Blob, catalog: Role[]): Promise<PdfTextLine[]> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng').catch(() => {
    throw new Error(
      'The text reader could not be downloaded. Reading an image needs an internet connection the first time.',
    );
  });

  try {
    const { data } = await worker.recognize(image, {}, { blocks: true, text: false });
    const lines = (data.blocks ?? []).flatMap((block) =>
      block.paragraphs.flatMap((paragraph) =>
        paragraph.lines.map((line) =>
          line.words.map((word) => ({ text: word.text, x0: word.bbox.x0 })),
        ),
      ),
    );
    return getOcrTextLines(lines, catalog);
  } finally {
    await worker.terminate();
  }
}

/**
 * Turns recognized lines into text lines. When the image is a table with a name column and an
 * ability column, each line is split into a name segment and an ability segment, and anything
 * left of the names, such as a misread character icon, is dropped.
 */
export function getOcrTextLines(lines: OcrWord[][], catalog: Role[]): PdfTextLine[] {
  const roleNames = new Set(catalog.map((role) => normalizeRoleName(role.name)));
  const [nameX, abilityX] = getTableColumns(lines, (text) =>
    roleNames.has(normalizeRoleName(text)),
  );

  return lines
    .map((words) => words.filter((word) => word.text.trim()))
    .filter((words) => words.length > 0)
    .map((words) => {
      const nameStart = words.findIndex((word) => isInColumn(word, nameX));
      const abilityStart = words.findIndex((word) => isInColumn(word, abilityX));

      if (nameX === undefined || nameStart < 0 || abilityStart <= nameStart) {
        return [{ text: joinWords(words) }];
      }

      return [
        { style: OCR_NAME_STYLE, text: joinWords(words.slice(nameStart, abilityStart)) },
        { style: OCR_ABILITY_STYLE, text: joinWords(words.slice(abilityStart)) },
      ];
    });
}

/**
 * The name and ability columns, if the image looks like a table: names are where character names
 * start most often, and abilities are the busiest column to the right of them.
 */
function getTableColumns(
  lines: OcrWord[][],
  isRoleName: (text: string) => boolean,
): [number, number] | [] {
  const columns: { lines: Set<number>; nameLines: Set<number>; x: number }[] = [];

  lines.forEach((words, lineIndex) => {
    words.forEach((word, wordIndex) => {
      let column = columns.find((candidate) => isInColumn(word, candidate.x));
      if (!column) {
        column = { lines: new Set(), nameLines: new Set(), x: word.x0 };
        columns.push(column);
      }
      column.lines.add(lineIndex);

      for (let count = 1; count <= MAX_NAME_WORDS; count += 1) {
        if (isRoleName(joinWords(words.slice(wordIndex, wordIndex + count)))) {
          column.nameLines.add(lineIndex);
        }
      }
    });
  });

  const nameColumn = columns
    .filter((column) => column.nameLines.size >= MIN_COLUMN_LINES)
    .sort((first, second) => second.nameLines.size - first.nameLines.size)[0];
  const abilityColumn = columns
    .filter(
      (column) =>
        nameColumn &&
        column.x > nameColumn.x + COLUMN_TOLERANCE &&
        column.lines.size >= MIN_COLUMN_LINES,
    )
    .sort((first, second) => second.lines.size - first.lines.size || first.x - second.x)[0];

  return nameColumn && abilityColumn ? [nameColumn.x, abilityColumn.x] : [];
}

function isInColumn(word: OcrWord, x: number | undefined) {
  return x !== undefined && Math.abs(word.x0 - x) <= COLUMN_TOLERANCE;
}

function joinWords(words: OcrWord[]) {
  return words
    .map((word) => word.text)
    .join(' ')
    .trim();
}
