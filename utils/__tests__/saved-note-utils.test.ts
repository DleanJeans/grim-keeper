import type { SavedNote } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';
import {
  detectRoleIdsInNote,
  getPlayerNameMatches,
  getRoleNameMatches,
  getSavedNote,
  getSavedNotesForRole,
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

describe('getSavedNotesForRole', () => {
  const note = (id: string, roleIds: string[], text: string, createdAt: string): SavedNote => ({
    createdAt,
    day: 1,
    gameId: 'game-1',
    id,
    playerName: '',
    roleIds,
    scriptName: '',
    text,
    updatedAt: createdAt,
  });

  it('returns the notes for the role, newest first, without repeated texts', () => {
    const notes = [
      note('a', ['empath'], 'Old empath note', '2026-01-01T00:00:00.000Z'),
      note('b', ['imp'], 'Imp note', '2026-01-02T00:00:00.000Z'),
      note('c', ['empath', 'imp'], 'New empath note', '2026-01-03T00:00:00.000Z'),
      note('d', ['empath'], 'Old empath note', '2026-01-04T00:00:00.000Z'),
    ];

    expect(getSavedNotesForRole(notes, 'empath').map((item) => item.id)).toEqual(['d', 'c']);
    expect(getSavedNotesForRole(notes, 'chef')).toEqual([]);
  });

  it('includes notes for the plain role when the claim is a good or evil variant', () => {
    const notes = [
      note('a', ['gunslinger'], 'Gunslinger note', '2026-01-01T00:00:00.000Z'),
      note('b', ['empath'], 'Empath note', '2026-01-02T00:00:00.000Z'),
    ];

    expect(getSavedNotesForRole(notes, 'gunslinger_good').map((item) => item.id)).toEqual(['a']);
    expect(getSavedNotesForRole(notes, 'empath_evil').map((item) => item.id)).toEqual(['b']);
  });
});
