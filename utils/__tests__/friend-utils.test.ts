import type { Friend, Game, SavedNote } from '@/types/game';
import {
  addMissingFriends,
  getFriendSummaries,
  getSelectedFriendIds,
  getUnsavedPlayerFriends,
  hasFriendName,
  mergeFriendPlayerSelection,
  sortFriendSummaries,
  sortStorytellerSummaries,
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

  it('sorts friends by games played, then saved notes', () => {
    const savedNotes: SavedNote[] = [
      {
        id: 'note-1',
        playerName: 'Ben',
        roleIds: [],
        text: 'One note',
        gameId: 'game-1',
        scriptName: '',
        day: 1,
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T00:00:00.000Z',
      },
      {
        id: 'note-2',
        playerName: 'Cora',
        roleIds: [],
        text: 'First note',
        gameId: 'game-1',
        scriptName: '',
        day: 1,
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T00:00:00.000Z',
      },
      {
        id: 'note-3',
        playerName: 'Cora',
        roleIds: [],
        text: 'Second note',
        gameId: 'game-2',
        scriptName: '',
        day: 1,
        createdAt: '2026-07-07T00:00:00.000Z',
        updatedAt: '2026-07-07T00:00:00.000Z',
      },
    ];

    expect(
      sortFriendSummaries(getFriendSummaries(games, []), savedNotes).map((friend) => friend.name),
    ).toEqual(['Alice', 'Cora', 'Ben']);
  });

  it('counts and sorts friends by storyteller games', () => {
    const storytellerGames = games.map((game, index) => ({
      ...game,
      players: [
        ...game.players.map((player) =>
          player.name.trim().toLocaleLowerCase() === 'alice' ||
          (index === 0 && player.name === 'Ben')
            ? { ...player, isStoryteller: true }
            : player,
        ),
      ],
    }));
    const summaries = getFriendSummaries(storytellerGames, []);

    expect(summaries).toEqual([
      expect.objectContaining({ name: 'Alice', gamesStorytold: 2 }),
      expect.objectContaining({ name: 'Ben', gamesStorytold: 1 }),
      expect.objectContaining({ name: 'Cora', gamesStorytold: 0 }),
    ]);
    expect(sortStorytellerSummaries(summaries).map((friend) => friend.name)).toEqual([
      'Alice',
      'Ben',
      'Cora',
    ]);
  });

  it('merges selected friend players while preserving manual players', () => {
    const friends = [
      { createdAt: games[0].createdAt, id: 'alice', name: 'Alice' },
      { createdAt: games[0].createdAt, id: 'ben', name: 'Ben' },
      { createdAt: games[0].createdAt, id: 'cora', name: 'Cora' },
    ];

    expect(
      mergeFriendPlayerSelection(
        [
          { id: 'manual', name: 'Manual Player' },
          { id: 'alice', name: 'Alice' },
        ],
        friends.map((friend) => ({ ...friend, gamesPlayed: 0, gamesStorytold: 0 })),
        ['alice', 'cora'],
      ),
    ).toEqual([
      { id: 'manual', name: 'Manual Player' },
      { id: 'alice', name: 'Alice' },
      { id: 'cora', name: 'Cora' },
    ]);
  });

  it('matches players typed in by name to their friends', () => {
    const friends = [
      { createdAt: '', gamesPlayed: 2, gamesStorytold: 0, id: 'alice', name: 'Alice' },
      { createdAt: '', gamesPlayed: 1, gamesStorytold: 0, id: 'ben', name: 'Ben' },
    ];
    const players = [
      { id: 'draft-1', name: 'ben' },
      { id: 'game-player-7', name: 'Alice' },
      { id: 'draft-2', name: 'Newcomer' },
    ];

    expect(getSelectedFriendIds(players, friends)).toEqual(['ben', 'alice']);
    expect(getUnsavedPlayerFriends(players, friends)).toEqual([
      { createdAt: '', gamesPlayed: 0, gamesStorytold: 0, id: 'draft-2', name: 'Newcomer' },
    ]);
  });

  it('keeps typed-in players that stay selected and drops the ones unselected', () => {
    const players = [
      { id: 'draft-1', name: 'Ben' },
      { id: 'game-player-7', name: 'Alice' },
      { id: 'draft-2', name: 'Newcomer' },
    ];
    const friends = [
      { createdAt: '', gamesPlayed: 2, gamesStorytold: 0, id: 'alice', name: 'Alice' },
      { createdAt: '', gamesPlayed: 1, gamesStorytold: 0, id: 'ben', name: 'Ben' },
    ];
    const pickerFriends = [...getUnsavedPlayerFriends(players, friends), ...friends];

    expect(mergeFriendPlayerSelection(players, pickerFriends, ['alice', 'draft-2'])).toEqual([
      { id: 'game-player-7', name: 'Alice' },
      { id: 'draft-2', name: 'Newcomer' },
    ]);
  });
});
