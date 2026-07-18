import type { SavedNote } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';
import {
  detectRoleIdsInNote,
  getPlayerNameMatches,
  getRoleNameMatches,
  getSavedNote,
  getSavedNoteTextsForRole,
} from '@/utils/saved-note-utils';

const savedNotes: SavedNote[] = [
  {
    id: 'saved-note-1',
    playerName: 'Alice Smith',
    roleIds: ['empath', 'imp'],
    text: 'The bluff only makes sense if Alice saw a zero.',
    gameId: 'game-1',
    scriptId: 'script-1',
    scriptName: 'Trouble Brewing',
    day: 2,
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  },
  {
    id: 'saved-note-2',
    playerName: 'Ben',
    roleIds: ['imp'],
    text: 'Watch the nomination timing.',
    gameId: 'game-1',
    scriptId: 'script-1',
    scriptName: 'Trouble Brewing',
    day: 2,
    createdAt: '2026-07-17T00:01:00.000Z',
    updatedAt: '2026-07-17T00:01:00.000Z',
  },
];

describe('saved note utilities', () => {
  it('finds a note by normalized player name and trimmed text', () => {
    expect(
      getSavedNote(
        savedNotes,
        ' alice   smith ',
        ' The bluff only makes sense if Alice saw a zero. ',
      )?.roleIds,
    ).toEqual(['empath', 'imp']);
  });

  it('returns only notes targeted to a role', () => {
    expect(getSavedNoteTextsForRole(savedNotes, 'empath')).toEqual([
      'The bluff only makes sense if Alice saw a zero.',
    ]);
    expect(getSavedNoteTextsForRole(savedNotes, 'imp')).toEqual([
      'The bluff only makes sense if Alice saw a zero.',
      'Watch the nomination timing.',
    ]);
  });

  it('detects script role names in note text without matching inside other words', () => {
    const roles = [
      { id: 'imp', name: 'Imp' },
      { id: 'devils_advocate', name: "Devil's Advocate" },
      { id: 'empath', name: 'Empath' },
    ];

    expect(
      detectRoleIdsInNote(
        "A simple bluff as the EMPATH, then Devil's   Advocate was confirmed.",
        roles,
      ),
    ).toEqual(['devils_advocate', 'empath']);
  });

  it('locates whole role names for inline role references', () => {
    const roles = [
      { id: 'imp', name: 'Imp' },
      { id: 'devils_advocate', name: "Devil's Advocate" },
    ];

    expect(
      getRoleNameMatches("The IMP blamed Devil's   Advocate, not simple.", roles).map(
        ({ role, start, end }) => ({
          roleId: role.id,
          text: "The IMP blamed Devil's   Advocate, not simple.".slice(start, end),
        }),
      ),
    ).toEqual([
      { roleId: 'imp', text: 'IMP' },
      { roleId: 'devils_advocate', text: "Devil's   Advocate" },
    ]);
  });

  it('locates whole player names without matching inside other words', () => {
    const players = [
      { id: 'alice', name: 'Alice', seat: 1 },
      { id: 'alice-smith', name: 'Alice Smith', seat: 2 },
    ];

    expect(
      getPlayerNameMatches('Alice Smith spoke to malice, then Alice.', players).map(
        ({ player }) => player.id,
      ),
    ).toEqual(['alice-smith', 'alice']);
  });

  it('matches singular and plural character types case-insensitively', () => {
    expect(
      getRoleNameMatches(
        'GOODS, evils, townsfolks, one traveler and many travelers.',
        GENERIC_CHARACTER_TYPE_ROLE_REFERENCES,
      ).map(({ role }) => role.name),
    ).toEqual(['Goods', 'Evils', 'Townsfolks', 'Traveler', 'Travelers']);
  });
});
