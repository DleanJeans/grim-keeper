import type { Role } from '@/types/game';
import { getOcrTextLines, type OcrWord } from '@/utils/image-text';
import { parseScriptPdfText } from '@/utils/pdf-script-parser';
import noGreaterJoyWords from './fixtures/no-greater-joy-ocr.json';

const catalog: Role[] = [
  ['clockmaker', 'Clockmaker', 'townsfolk'],
  ['investigator', 'Investigator', 'townsfolk'],
  ['empath', 'Empath', 'townsfolk'],
  ['chambermaid', 'Chambermaid', 'townsfolk'],
  ['artist', 'Artist', 'townsfolk'],
  ['sage', 'Sage', 'townsfolk'],
  ['drunk', 'Drunk', 'outsider'],
  ['klutz', 'Klutz', 'outsider'],
  ['scarletwoman', 'Scarlet Woman', 'minion'],
  ['baron', 'Baron', 'minion'],
  ['imp', 'Imp', 'demon'],
  ['washerwoman', 'Washerwoman', 'townsfolk'],
].map(([id, name, team]) => ({ id, name, team }));

/** Words recognized from a photo of the "No Greater Joy" script sheet. */
const photoLines: OcrWord[][] = noGreaterJoyWords;

describe('getOcrTextLines', () => {
  it('reads a script photo with icon marks before each name', () => {
    const draft = parseScriptPdfText(getOcrTextLines(photoLines, catalog), catalog);

    expect(draft.name).toBe('No Greater Joy');
    expect(draft.roles.map((role) => role.id)).toEqual([
      'clockmaker',
      'investigator',
      'empath',
      'chambermaid',
      'artist',
      'sage',
      'drunk',
      'klutz',
      'scarletwoman',
      'baron',
      'imp',
    ]);
    expect(draft.unmatched).toEqual([]);
  });

  it('splits the name column from the ability column and reports misread names', () => {
    const lines = photoLines.map((words) =>
      words.map((word) =>
        word.text === 'Chambermaid'
          ? { ...word, text: 'Chambcrmaid' }
          : word.text === 'Artist'
            ? { ...word, text: 'Lantern' }
            : word,
      ),
    );

    const textLines = getOcrTextLines(lines, catalog);
    const draft = parseScriptPdfText(textLines, catalog);

    expect(textLines[1].map((segment) => segment.text)).toEqual([
      'Clockmaker',
      'You start knowing how many steps from the Demon to its nearest Minion.',
    ]);
    expect(draft.roles).toHaveLength(9);
    expect(draft.unmatched.map((role) => role.name)).toEqual(['Chambcrmaid', 'Lantern']);
  });

  it('keeps whole lines when the image is not a two-column table', () => {
    const lines = getOcrTextLines(
      [
        [
          { text: 'Imp:', x0: 10 },
          { text: 'Each', x0: 60 },
          { text: 'night*,', x0: 110 },
        ],
      ],
      catalog,
    );

    expect(lines).toEqual([[{ text: 'Imp: Each night*,' }]]);
  });
});
