jest.mock('expo-sqlite/localStorage/install', () => ({}));
jest.mock('react-native', () => ({ Platform: { OS: 'web' } }));
jest.mock('@/utils/web-storage', () => ({
  webStorage: {
    getItem: jest.fn(async () => null),
    removeItem: jest.fn(async () => undefined),
    setItem: jest.fn(async () => undefined),
  },
}));

import { useGameStore } from '@/store/game-store';
import type { Game, SavedNote, StoredScript } from '@/types/game';
import { getGameStats } from '@/utils/game-utils';
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
      {
        ...baseNote,
        id: 'note-1',
        playerName: 'Alice Smith',
        createdAt: '2026-07-17T00:00:00.000Z',
      },
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

describe('setGameResult', () => {
  const game: Game = {
    activeDay: 1,
    conversations: [],
    createdAt: '2026-07-07T00:00:00.000Z',
    id: 'game-1',
    players: [],
    updatedAt: '2026-07-07T00:00:00.000Z',
  };

  afterEach(() => {
    useGameStore.setState({ games: [] });
  });

  it('sets, changes, and clears a game result', () => {
    useGameStore.setState({ games: [game] });

    useGameStore.getState().setGameResult('game-1', 'won');
    expect(useGameStore.getState().games[0]).toMatchObject({ result: 'won' });

    useGameStore.getState().setGameResult('game-1', 'lost');
    expect(useGameStore.getState().games[0]).toMatchObject({ result: 'lost' });

    useGameStore.getState().setGameResult('game-1');
    expect(useGameStore.getState().games[0].result).toBeUndefined();
    expect(useGameStore.getState().games[0].updatedAt).not.toBe(game.updatedAt);
  });

  it('updates the Home stats snapshot immediately when a result changes', () => {
    useGameStore.setState({ games: [game] });
    let stats = getGameStats(useGameStore.getState().games);
    const unsubscribe = useGameStore.subscribe((state) => {
      stats = getGameStats(state.games);
    });

    useGameStore.getState().setGameResult('game-1', 'won');

    unsubscribe();
    expect(stats).toMatchObject({ completedGames: 1, totalGames: 1, winRate: 100, wins: 1 });
  });
});

describe('updateGamePlayers', () => {
  afterEach(() => {
    useGameStore.setState({ games: [], friends: [] });
  });

  it('preserves retained player state while adding and reordering players', () => {
    const game: Game = {
      activeDay: 2,
      conversations: [],
      createdAt: '2026-07-07T00:00:00.000Z',
      id: 'game-1',
      mapHeight: 400,
      mapWidth: 600,
      players: [
        { id: 'app-user', name: 'You', seat: 0 },
        {
          id: 'alice',
          name: 'Alice',
          seat: 1,
          death: { day: 1, kind: 'night', updatedAt: '2026-07-08T00:00:00.000Z' },
          position: { x: 80, y: 120 },
          roleAssignments: [
            {
              day: 1,
              kind: 'confirm',
              roleIds: ['empath'],
              updatedAt: '2026-07-08T00:00:00.000Z',
            },
            {
              day: 2,
              kind: 'claim',
              roleIds: ['soldier'],
              updatedAt: '2026-07-09T00:00:00.000Z',
            },
          ],
        },
      ],
      updatedAt: '2026-07-07T00:00:00.000Z',
    };

    useGameStore.setState({ games: [game] });

    useGameStore.getState().updateGamePlayers('game-1', [
      { id: 'alice', name: 'Alice' },
      { id: 'draft-traveler', name: 'Traveler' },
    ]);

    const players = useGameStore.getState().games[0].players;
    expect(players).toHaveLength(3);
    expect(players[1]).toEqual(game.players[1]);
    expect(players[2]).toMatchObject({
      id: 'traveler',
      name: 'Traveler',
      position: { x: 300, y: 200 },
      seat: 2,
    });
  });

  it('cleans references only for players removed by the edit', () => {
    const game: Game = {
      activeDay: 1,
      conversations: [
        {
          id: 'conversation-1',
          day: 1,
          initiatorId: 'alice',
          participantIds: ['alice', 'bob'],
          createdAt: '2026-07-07T00:00:00.000Z',
        },
      ],
      createdAt: '2026-07-07T00:00:00.000Z',
      id: 'game-1',
      players: [
        { id: 'app-user', name: 'You', seat: 0 },
        { id: 'alice', name: 'Alice', seat: 1, position: { x: 80, y: 120 } },
        {
          id: 'bob',
          name: 'Bob',
          seat: 2,
          death: {
            day: 1,
            kind: 'night',
            updatedAt: '2026-07-08T00:00:00.000Z',
            killerPlayerId: 'alice',
          },
        },
      ],
      updatedAt: '2026-07-07T00:00:00.000Z',
    };

    useGameStore.setState({ games: [game] });

    useGameStore.getState().updateGamePlayers('game-1', [{ id: 'alice', name: 'Alice' }]);

    expect(useGameStore.getState().games[0].players).toEqual([
      { id: 'app-user', name: 'You', seat: 0 },
      { id: 'alice', name: 'Alice', seat: 1, position: { x: 80, y: 120 } },
    ]);
    expect(useGameStore.getState().games[0].conversations).toEqual([]);
  });
});

describe('addPlayer', () => {
  afterEach(() => {
    useGameStore.setState({ games: [], friends: [] });
  });

  it('places a newly added player at the center of the map', () => {
    const game: Game = {
      activeDay: 1,
      conversations: [],
      createdAt: '2026-07-07T00:00:00.000Z',
      id: 'game-1',
      mapHeight: 400,
      mapWidth: 600,
      players: [{ id: 'app-user', name: 'You', seat: 0 }],
      tokenSize: 68,
      updatedAt: '2026-07-07T00:00:00.000Z',
    };

    useGameStore.setState({ games: [game] });

    useGameStore.getState().addPlayer('game-1', 'Traveler');

    expect(useGameStore.getState().games[0].players[1]).toMatchObject({
      id: 'traveler',
      name: 'Traveler',
      position: { x: 300, y: 200 },
    });
  });
});

describe('dead vote usage', () => {
  const game: Game = {
    activeDay: 2,
    conversations: [
      {
        createdAt: '2026-07-07T00:00:00.000Z',
        day: 2,
        id: 'nomination-day-2',
        initiatorId: 'alice',
        kind: 'nomination',
        participantIds: ['alice', 'bob'],
        voterIds: ['bob'],
      },
      {
        createdAt: '2026-07-08T00:00:00.000Z',
        day: 3,
        id: 'nomination-day-3',
        initiatorId: 'alice',
        kind: 'nomination',
        participantIds: ['alice', 'bob'],
        voterIds: [],
      },
    ],
    createdAt: '2026-07-07T00:00:00.000Z',
    id: 'game-1',
    players: [
      { id: 'app-user', name: 'You', seat: 0 },
      { id: 'alice', name: 'Alice', seat: 1 },
      { id: 'bob', name: 'Bob', seat: 2 },
    ],
    updatedAt: '2026-07-07T00:00:00.000Z',
  };

  afterEach(() => {
    useGameStore.setState({ games: [] });
  });

  it('keeps the dead vote when a player votes on their execution day', () => {
    useGameStore.setState({ games: [game] });

    useGameStore.getState().setPlayerDeath('game-1', 'bob', {
      day: 2,
      kind: 'execution',
      updatedAt: '2026-07-08T00:00:00.000Z',
    });

    expect(useGameStore.getState().games[0].players[2].deadVoteUsed).toBeUndefined();
  });

  it('consumes and restores the dead vote for a later-day vote', () => {
    useGameStore.setState({ games: [game] });
    useGameStore.getState().setPlayerDeath('game-1', 'bob', {
      day: 2,
      kind: 'execution',
      updatedAt: '2026-07-08T00:00:00.000Z',
    });

    useGameStore.getState().updateNominationVotes('game-1', 'nomination-day-3', ['bob']);
    expect(useGameStore.getState().games[0].players[2].deadVoteUsed).toBe(true);

    useGameStore.getState().deleteConversation('game-1', 'nomination-day-3');
    expect(useGameStore.getState().games[0].players[2].deadVoteUsed).toBeUndefined();
  });
});

describe('storyteller players', () => {
  afterEach(() => {
    useGameStore.setState({ games: [], friends: [] });
  });

  it('creates a storyteller separately from seated players at map center', () => {
    const storyteller = {
      createdAt: '2026-07-07T00:00:00.000Z',
      id: 'storyteller',
      name: 'Storyteller',
    };
    useGameStore.setState({ appUserName: 'Keeper', friends: [storyteller], games: [] });

    const game = useGameStore.getState().createGame({
      mapHeight: 400,
      mapWidth: 600,
      playerNames: ['Storyteller', 'Alice'],
      storyteller,
    });

    expect(game.players).toHaveLength(3);
    expect(game.players[1]).toMatchObject({ id: 'alice', name: 'Alice', seat: 1 });
    expect(game.players[2]).toMatchObject({
      id: 'storyteller',
      isStoryteller: true,
      name: 'Storyteller',
      position: { x: 300, y: 200 },
      seat: -1,
    });
  });

  it('retains or removes the storyteller with its player references during edits', () => {
    const game: Game = {
      activeDay: 1,
      conversations: [
        {
          createdAt: '2026-07-07T00:00:00.000Z',
          day: 1,
          id: 'conversation-1',
          initiatorId: 'storyteller',
          participantIds: ['storyteller', 'alice'],
        },
      ],
      createdAt: '2026-07-07T00:00:00.000Z',
      id: 'game-1',
      mapHeight: 400,
      mapWidth: 600,
      players: [
        { id: 'app-user', name: 'Keeper', seat: 0 },
        { id: 'alice', name: 'Alice', seat: 1 },
        {
          id: 'storyteller',
          isStoryteller: true,
          name: 'Storyteller',
          position: { x: 300, y: 200 },
          seat: -1,
        },
      ],
      updatedAt: '2026-07-07T00:00:00.000Z',
    };
    const storyteller = {
      createdAt: game.createdAt,
      id: 'storyteller',
      name: 'Storyteller',
    };
    useGameStore.setState({ games: [game], friends: [storyteller] });

    useGameStore
      .getState()
      .updateGamePlayers('game-1', [{ id: 'alice', name: 'Alice' }], storyteller);

    expect(useGameStore.getState().games[0].players[2]).toEqual(game.players[2]);
    expect(useGameStore.getState().games[0].conversations).toEqual(game.conversations);

    useGameStore.getState().updateGamePlayers('game-1', [{ id: 'alice', name: 'Alice' }]);

    expect(useGameStore.getState().games[0].players).not.toContainEqual(
      expect.objectContaining({ isStoryteller: true }),
    );
    expect(useGameStore.getState().games[0].conversations).toEqual([]);
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
