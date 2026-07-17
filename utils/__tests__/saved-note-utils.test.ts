import type { SavedNote } from '@/types/game';
import {
  detectRoleIdsInNote,
  getSavedNote,
  getSavedNoteTextsForRole,
} from '@/utils/saved-note-utils';

const savedNotes: SavedNote[] = [
  {
    id: 'saved-note-1',
    playerName: 'Alice Smith',
    roleIds: ['empath', 'imp'],
    text: 'The bluff only makes sense if Alice saw a zero.',
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  },
  {
    id: 'saved-note-2',
    playerName: 'Ben',
    roleIds: ['imp'],
    text: 'Watch the nomination timing.',
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
});
