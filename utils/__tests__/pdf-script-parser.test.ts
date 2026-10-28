import type { Role } from '@/types/game';
import {
  createPdfScriptJson,
  getRoleSuggestions,
  type PdfScriptRoleChoice,
  PdfScriptTextError,
  parseScriptPdfText,
} from '@/utils/pdf-script-parser';
import { groupPdfTextItems, type PdfTextItem, type PdfTextLine } from '@/utils/pdf-text';
import { createHomebrewScript } from '@/utils/script-service';

const catalog: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
  { id: 'huntsman', name: 'Huntsman', team: 'townsfolk' },
  { id: 'spiritofivory', name: 'Spirit of Ivory', team: 'fabled' },
  { id: 'damsel', name: 'Damsel', team: 'outsider' },
  { id: 'drunk', name: 'Drunk', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'pithag', name: 'Pit-Hag', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'lilmonsta', name: "Lil' Monsta", team: 'demon' },
  { id: 'thief', name: 'Thief', team: 'traveller' },
  { id: 'generic_minion', name: 'Minion', team: 'minion' },
];

/** Plain text, one line per string, as copied out of a PDF without font details. */
function plainLines(text: string): PdfTextLine[] {
  return text
    .trim()
    .split('\n')
    .map((line) => [{ text: line.trim() }]);
}

describe('parseScriptPdfText', () => {
  it('reads roles grouped under team headings with the abilities on their own lines', () => {
    const draft = parseScriptPdfText(
      plainLines(`
        Sunny Day
        by Jane Doe
        TOWNSFOLK
        Washerwoman
        You start knowing that 1 of 2 players is a particular Townsfolk.
        Fortune Teller
        Each night, choose 2 players: you learn if either is a Demon.
        OUTSIDERS
        Drunk
        You do not know you are the Drunk.
        MINIONS
        Pit-Hag
        Each night*, choose a player & a character they become.
        DEMONS
        Lil’ Monsta
        Each night, Minions choose who babysits Lil' Monsta.
        TRAVELLERS
        Thief
        Each night, choose a player (not yourself): their vote counts negatively tomorrow.
      `),
      catalog,
    );

    expect(draft.name).toBe('Sunny Day');
    expect(draft.author).toBe('Jane Doe');
    expect(draft.roles.map((role) => role.id)).toEqual([
      'washerwoman',
      'fortuneteller',
      'drunk',
      'pithag',
      'lilmonsta',
      'thief',
    ]);
    expect(draft.unmatched).toEqual([]);
  });

  it('reads one role per line with the ability after the name', () => {
    const draft = parseScriptPdfText(
      plainLines(`
        Quick Game by Sam
        Townsfolk
        Washerwoman You start knowing that 1 of 2 players is a particular Townsfolk.
        Huntsman: Once per game, at night, choose a living player: the Damsel, if chosen, becomes a not-in-play Townsfolk.
        Outsiders
        Damsel – All Minions know a Damsel is in play.
        Lantern Keeper: Each night, you learn a number.
        Demons
        Imp Each night*, choose a player: they die.
      `),
      catalog,
    );

    expect(draft.name).toBe('Quick Game');
    expect(draft.author).toBe('Sam');
    expect(draft.roles.map((role) => role.id)).toEqual([
      'washerwoman',
      'huntsman',
      'damsel',
      'imp',
    ]);
    expect(draft.unmatched).toEqual([{ name: 'Lantern Keeper', team: 'outsider' }]);
  });

  it('does not take a role mentioned at the start of a wrapped ability line', () => {
    const draft = parseScriptPdfText(
      plainLines(`
        Mentions
        Townsfolk
        Huntsman
        Once per game, at night, choose a living player: the
        Damsel, if chosen, becomes a not-in-play Townsfolk.
        Demons
        Imp
        Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the
        Imp. Minions learn this.
      `),
      catalog,
    );

    expect(draft.roles.map((role) => role.id)).toEqual(['huntsman', 'imp']);
  });

  it('uses font details to find homebrew names and ignores the night order page', () => {
    const name = 'Bold:11';
    const ability = 'Regular:9';
    const draft = parseScriptPdfText(
      [
        [{ style: 'Bold:26', text: 'Imp Party' }],
        [{ style: 'Italic:12', text: 'by Jane Doe' }],
        // Team labels drawn as images leave no headings in the text.
        [
          { style: name, text: 'Washerwoman' },
          {
            style: ability,
            text: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
          },
        ],
        [
          { style: name, text: 'Lantern Keeper' },
          { style: ability, text: 'Each night, you learn a number.' },
        ],
        [{ style: ability, text: 'Good Player' }],
        [
          { style: name, text: 'Imp' },
          { style: ability, text: 'Each night*, choose a player: they die.' },
        ],
        [{ style: 'Bold:16', text: 'First Night' }],
        [{ style: ability, text: 'Minion Info' }],
        [{ style: ability, text: 'Washerwoman' }],
      ],
      catalog,
    );

    expect(draft.name).toBe('Imp Party');
    expect(draft.author).toBe('Jane Doe');
    expect(draft.roles.map((role) => role.id)).toEqual(['washerwoman', 'imp']);
    expect(draft.unmatched).toEqual([{ name: 'Lantern Keeper' }]);
  });

  it('reads a two-column page where each line holds two roles', () => {
    const lines = groupPdfTextItems([
      item('Two Columns', 40, 800, 24, 'Bold'),
      item('TOWNSFOLK', 40, 760, 14, 'Bold'),
      item('Washer', 40, 740, 11, 'Bold', 36),
      item('woman', 76, 740, 11, 'Bold', 36),
      item('You start knowing that 1 of 2 players', 130, 740.4, 9, 'Regular', 160),
      item('Fortune Teller', 320, 740, 11, 'Bold', 80),
      item('Each night, choose 2 players: you learn', 410, 739.8, 9, 'Regular', 160),
      item('is a particular Townsfolk.', 130, 729, 9, 'Regular', 100),
      item('if either is a Demon.', 410, 729, 9, 'Regular', 80),
    ]);

    expect(lines[2].map((segment) => segment.text)).toEqual([
      'Washerwoman',
      'You start knowing that 1 of 2 players',
      'Fortune Teller',
      'Each night, choose 2 players: you learn',
    ]);
    expect(parseScriptPdfText(lines, catalog).roles.map((role) => role.id)).toEqual([
      'washerwoman',
      'fortuneteller',
    ]);
  });

  it('says when a PDF has no text to read', () => {
    expect(() => parseScriptPdfText([], catalog)).toThrow(PdfScriptTextError);
    expect(() => parseScriptPdfText(plainLines('Page 1'), catalog)).toThrow(/scan/);
  });
});

describe('getRoleSuggestions', () => {
  it('suggests official roles with similar names', () => {
    expect(getRoleSuggestions('Washer Woman', catalog).map((role) => role.id)[0]).toBe(
      'washerwoman',
    );
    expect(getRoleSuggestions('Fortuneteler', catalog).map((role) => role.id)).toEqual([
      'fortuneteller',
    ]);
    expect(getRoleSuggestions('Lantern Keeper', catalog)).toEqual([]);
  });
});

describe('createPdfScriptJson', () => {
  it('saves matched roles, chosen fixes and custom names through the JSON import', () => {
    const draft = parseScriptPdfText(
      plainLines(`
        Fixes
        Townsfolk
        Washerwoman
        You start knowing that 1 of 2 players is a particular Townsfolk.
        Fortune Telller
        Each night, choose 2 players: you learn if either is a Demon.
        Outsiders
        Lantern Keeper
        Each night, you learn a number.
        Glass Blower
        Each night, you learn a colour.
      `),
      catalog,
    );
    const choices = new Map<string, PdfScriptRoleChoice>([
      ['Fortune Telller', { kind: 'role', roleId: 'fortuneteller' }],
      ['Lantern Keeper', { kind: 'custom' }],
    ]);

    const script = createHomebrewScript(createPdfScriptJson(draft, choices, catalog), catalog);

    expect(script.name).toBe('Fixes');
    expect(script.roles.map(({ id, name, team }) => ({ id, name, team }))).toEqual([
      { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
      { id: 'fortuneteller', name: 'Fortune Teller', team: 'townsfolk' },
      { id: 'lanternkeeper', name: 'Lantern Keeper', team: 'outsider' },
    ]);
  });
});

function item(
  str: string,
  x: number,
  y: number,
  height: number,
  fontName: string,
  width = str.length * height * 0.5,
): PdfTextItem {
  return { fontName, height, str, transform: [height, 0, 0, height, x, y], width };
}
