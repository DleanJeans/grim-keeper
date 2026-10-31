import type { Game, SavedNote } from '@/types/game';
import { searchNotes } from '@/utils/note-search-utils';

const at = (minute: number) => `2026-10-31T00:${String(minute).padStart(2, '0')}:00.000Z`;

const savedNotes: SavedNote[] = [
  {
    createdAt: at(1),
    day: 1,
    gameId: 'g1',
    id: 's1',
    playerName: 'Ann',
    roleIds: ['chef'],
    scriptName: 'Trouble Brewing',
    text: 'Always claims early',
    updatedAt: at(1),
  },
  {
    createdAt: at(2),
    day: 1,
    gameId: '',
    id: 's2',
    playerName: '',
    roleIds: [],
    scriptName: '',
    text: 'Bluff Chef next time',
    updatedAt: at(2),
  },
];

const game: Game = {
  activeDay: 2,
  conversations: [],
  createdAt: at(0),
  id: 'g1',
  playerDayNotes: [
    {
      day: 2,
      notes: [
        { createdAt: at(3), id: 'n1', text: 'Pushed hard on Bob', updatedAt: at(3) },
        { createdAt: at(4), id: 'n2', text: 'quiet', updatedAt: at(4) },
      ],
      phase: 'night',
      playerId: 'a',
      updatedAt: at(4),
    },
  ],
  players: [{ id: 'a', name: 'Ann', seat: 0 }],
  updatedAt: at(4),
};

const roles = [{ id: 'chef', name: 'Chef', team: 'townsfolk' }];

describe('searchNotes', () => {
  it('matches note text, player names and character names, newest first', () => {
    const results = searchNotes('chef', savedNotes, [game], roles);
    expect(results.savedNotes.map((note) => note.id)).toEqual(['s2', 's1']);
    expect(results.gameNotes).toEqual([]);

    const byPlayer = searchNotes(' ANN ', savedNotes, [game], roles);
    expect(byPlayer.savedNotes.map((note) => note.id)).toEqual(['s1']);
    expect(byPlayer.gameNotes.map((note) => note.text)).toEqual(['quiet', 'Pushed hard on Bob']);
    expect(byPlayer.gameNotes[0]).toMatchObject({ day: 2, gameId: 'g1', phase: 'night' });
  });

  it('returns nothing for a blank query', () => {
    expect(searchNotes('  ', savedNotes, [game], roles)).toEqual({ gameNotes: [], savedNotes: [] });
  });
});
