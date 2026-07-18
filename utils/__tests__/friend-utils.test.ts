import type { Friend, Game } from '@/types/game';
import {
  addMissingFriends,
  getFriendSummaries,
  hasFriendName,
} from '@/utils/friend-utils';

const games: Game[] = [
  {
    id: 'game-2',
    activeDay: 1,
    createdAt: '2026-07-07T00:00:00.000Z',
    updatedAt: '2026-07-07T00:00:00.000Z',
    players: [
      { id: 'player-1', name: 'Alice', seat: 0 },
      { id: 'player-2', name: 'Ben', seat: 1 },
    ],
    conversations: [],
  },
  {
    id: 'game-1',
    activeDay: 1,
    createdAt: '2026-07-06T00:00:00.000Z',
    updatedAt: '2026-07-06T00:00:00.000Z',
    players: [
      { id: 'player-3', name: ' alice ', seat: 0 },
      { id: 'player-4', name: 'Cora', seat: 1 },
    ],
    conversations: [],
  },
];

describe('friend utils', () => {
  it('pulls friends from games and counts games played together once per game', () => {
    expect(getFriendSummaries(games, [])).toEqual([
      expect.objectContaining({ name: 'Alice', gamesPlayed: 2 }),
      expect.objectContaining({ name: 'Ben', gamesPlayed: 1 }),
      expect.objectContaining({ name: 'Cora', gamesPlayed: 1 }),
    ]);
  });

  it('prevents duplicate manual friends by normalized name', () => {
    const friends: Friend[] = [
      { id: 'friend-1', name: 'Alice Smith', createdAt: games[0].createdAt },
    ];

    expect(hasFriendName(getFriendSummaries([], friends), ' alice   smith ')).toBe(true);
    expect(addMissingFriends(friends, ['Alice Smith', 'Drew'], games[0].createdAt)).toHaveLength(2);
  });

  it('excludes the app user from friend summaries', () => {
    expect(getFriendSummaries(games, [], 'Alice')).toEqual([
      expect.objectContaining({ name: 'Ben', gamesPlayed: 1 }),
      expect.objectContaining({ name: 'Cora', gamesPlayed: 1 }),
    ]);
  });
});
