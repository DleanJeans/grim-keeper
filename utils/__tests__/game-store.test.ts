import type { Game, SavedNote, StoredScript } from '@/types/game';
import { getNotesForPlayer, migrateV2ToV3 } from '@/utils/saved-note-store';

const baseNote: Omit<SavedNote, 'playerName' | 'createdAt'> = {
  day: 1,
  gameId: 'game-1',
  id: 'note-1',
  roleIds: ['empath'],
  scriptId: 'script-1',
  scriptName: 'Trouble Brewing',
  text: 'Saw a 0.',
  updatedAt: '2026-07-17T00:00:00.000Z',
};

describe('getNotesForPlayer', () => {
  it('returns only notes whose player name matches after normalization', () => {
    const savedNotes: SavedNote[] = [
      { ...baseNote, id: 'note-1', playerName: 'Alice Smith', createdAt: '2026-07-17T00:00:00.000Z' },
      { ...baseNote, id: 'note-2', playerName: 'Ben', createdAt: '2026-07-17T00:01:00.000Z' },
    ];

    expect(getNotesForPlayer(savedNotes, ' alice   smith ').map((note) => note.id)).toEqual([
      'note-1',
    ]);
  });

  it('returns newest notes first by createdAt', () => {
    const savedNotes: SavedNote[] = [
      { ...baseNote, id: 'note-1', playerName: 'Alice', createdAt: '2026-07-17T00:00:00.000Z' },
      { ...baseNote, id: 'note-2', playerName: 'Alice', createdAt: '2026-07-17T00:05:00.000Z' },
      { ...baseNote, id: 'note-3', playerName: 'Alice', createdAt: '2026-07-17T00:02:00.000Z' },
    ];

    expect(getNotesForPlayer(savedNotes, 'Alice').map((note) => note.id)).toEqual([
      'note-2',
      'note-3',
      'note-1',
    ]);
  });

  it('returns an empty array for an empty player name', () => {
    const savedNotes: SavedNote[] = [
      { ...baseNote, id: 'note-1', playerName: 'Alice', createdAt: '2026-07-17T00:00:00.000Z' },
    ];

    expect(getNotesForPlayer(savedNotes, '   ')).toEqual([]);
  });
});

describe('migrateV2ToV3', () => {
  it('converts friend notes to saved notes and strips notes from friends', () => {
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-07-07T00:00:00.000Z',
      updatedAt: '2026-07-07T00:00:00.000Z',
      players: [],
      conversations: [],
      script: {
        id: 'script-1',
        name: 'Trouble Brewing',
        roles: [],
        updatedAt: '2026-07-07T00:00:00.000Z',
        version: '1',
      },
    };

    const result = migrateV2ToV3({
      friends: [
        {
          createdAt: '2026-07-07T00:00:00.000Z',
          id: 'friend-1',
          name: 'Alice Smith',
          notes: [
            {
              id: 'friend-note-1',
              text: 'Claims Empath when bluffing.',
              gameId: 'game-1',
              scriptId: 'script-1',
              day: 2,
              createdAt: '2026-07-08T00:00:00.000Z',
            },
          ],
        },
      ],
      games: [game],
      savedNotes: [],
      scripts: [],
    });

    expect(result.savedNotes).toEqual([
      {
        createdAt: '2026-07-08T00:00:00.000Z',
        day: 2,
        gameId: 'game-1',
        id: 'friend-note-1',
        playerName: 'Alice Smith',
        roleIds: [],
        scriptId: 'script-1',
        scriptName: 'Trouble Brewing',
        text: 'Claims Empath when bluffing.',
        updatedAt: '2026-07-08T00:00:00.000Z',
      },
    ]);
    expect(result.friends).toEqual([
      { id: 'friend-1', name: 'Alice Smith', createdAt: '2026-07-07T00:00:00.000Z' },
    ]);
  });

  it('does not duplicate notes that already exist in savedNotes', () => {
    const result = migrateV2ToV3({
      friends: [
        {
          createdAt: '2026-07-07T00:00:00.000Z',
          id: 'friend-1',
          name: 'Alice',
          notes: [
            {
              id: 'note-1',
              text: 'Saw a 0.',
              createdAt: '2026-07-08T00:00:00.000Z',
            },
          ],
        },
      ],
      games: [],
      savedNotes: [
        {
          ...baseNote,
          id: 'note-1',
          playerName: 'Alice',
          createdAt: '2026-07-08T00:00:00.000Z',
        },
      ],
      scripts: [],
    });

    expect(result.savedNotes).toHaveLength(1);
  });

  it('falls back to an empty scriptName when no game or script matches', () => {
    const result = migrateV2ToV3({
      friends: [
        {
          createdAt: '2026-07-07T00:00:00.000Z',
          id: 'friend-1',
          name: 'Alice',
          notes: [
            {
              id: 'note-1',
              text: 'Untagged legacy note.',
              createdAt: '2026-07-08T00:00:00.000Z',
            },
          ],
        },
      ],
      games: [],
      savedNotes: [],
      scripts: [] as StoredScript[],
    });

    expect(result.savedNotes?.[0]).toEqual(
      expect.objectContaining({ scriptName: '', gameId: '', day: 1 }),
    );
  });
});
