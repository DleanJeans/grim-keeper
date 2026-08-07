import type { Game, SavedNote, StoredScript } from '@/types/game';
import {
  createConversationId,
  createFriendId,
  createGameId,
  createNoteId,
  createSavedNoteId,
  createScriptId,
  migrateObjectIds,
} from '@/utils/object-id';

describe('object IDs', () => {
  it('creates URL-friendly IDs for new objects', () => {
    expect(createGameId('Trouble Brewing', '2026-07-15T10:20:00.000Z', [])).toBe(
      'trouble-brewing-202607151020',
    );
    expect(createConversationId('2026-07-15T10:20:30.000Z', [])).toBe(
      'conversation-20260715102030',
    );
    expect(createNoteId('2026-07-15T10:20:30.000Z', [])).toBe('note-20260715102030');
    expect(createSavedNoteId('2026-07-15T10:20:30.000Z', [])).toBe('saved-note-20260715102030');
    expect(createFriendId('Andy O’Brien', [])).toBe('andy-o-brien');
    expect(createFriendId('App User', [])).toBe('app-user-2');
    expect(
      createScriptId({ name: 'Extension Cord', remoteId: 42, author: 'Homebrew Author' }, []),
    ).toBe('42-extension-cord');
    expect(
      createScriptId(
        { name: 'Trouble Brewing', remoteId: 178, author: 'The Pandemonium Institute' },
        [],
      ),
    ).toBe('trouble-brewing');
  });

  it('adds a suffix only when clean IDs collide', () => {
    expect(createFriendId('Andy', ['andy'])).toBe('andy-2');
    expect(
      createGameId('Trouble Brewing', '2026-07-15T10:20:00.000Z', ['trouble-brewing-202607151020']),
    ).toBe('trouble-brewing-202607151020-2');
    expect(createConversationId('2026-07-15T10:20:30.000Z', ['conversation-20260715102030'])).toBe(
      'conversation-20260715102030-2',
    );
    expect(createNoteId('2026-07-15T10:20:30.000Z', ['note-20260715102030'])).toBe(
      'note-20260715102030-2',
    );
  });

  it('migrates IDs and every saved game and script reference', () => {
    const script: StoredScript = {
      id: 'script-remote-42',
      remoteId: 42,
      name: 'Extension Cord',
      version: '5.1.0',
      roles: [],
      updatedAt: '2026-07-15T10:20:00.000Z',
    };
    const game: Game = {
      id: 'game-old',
      activeDay: 1,
      createdAt: '2026-07-15T10:20:00.000Z',
      updatedAt: '2026-07-15T10:20:00.000Z',
      players: [],
      conversations: [],
      playerDayNotes: [
        {
          day: 1,
          playerId: 'andy',
          notes: [
            {
              id: 'note-old',
              text: 'Note',
              createdAt: '2026-07-15T10:20:00.000Z',
              updatedAt: '2026-07-15T10:20:00.000Z',
            },
          ],
          updatedAt: '2026-07-15T10:20:00.000Z',
        },
      ],
      script,
    };
    const note: SavedNote = {
      id: 'note-1',
      playerName: 'Andy',
      roleIds: [],
      text: 'Note',
      gameId: game.id,
      scriptId: script.id,
      scriptName: script.name,
      day: 1,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt,
    };

    const result = migrateObjectIds({
      friends: [{ id: 'friend-old', name: 'Andy', createdAt: game.createdAt }],
      games: [game],
      savedNotes: [note],
      scripts: [script],
    });

    expect(result.friends?.[0].id).toBe('andy');
    expect(result.games?.[0].id).toBe('extension-cord-202607151020');
    expect(result.games?.[0].script?.id).toBe('42-extension-cord');
    expect(result.scripts?.[0].id).toBe('42-extension-cord');
    expect(result.savedNotes?.[0]).toMatchObject({
      id: 'saved-note-20260715102000',
      gameId: 'extension-cord-202607151020',
      scriptId: '42-extension-cord',
    });
    expect(result.games?.[0].playerDayNotes?.[0].notes[0].id).toBe('note-20260715102000');
  });

  it('maps existing player IDs to friend IDs and keeps references in sync', () => {
    const game: Game = {
      id: 'game-old',
      activeDay: 1,
      createdAt: '2026-07-15T10:20:00.000Z',
      updatedAt: '2026-07-15T10:20:00.000Z',
      players: [
        { id: 'app-user', name: 'Keeper', seat: 0 },
        { id: 'player-andy', name: 'Andy', seat: 1 },
      ],
      conversations: [
        {
          id: 'conversation-1',
          day: 1,
          participantIds: ['app-user', 'player-andy'],
          initiatorId: 'player-andy',
          voterIds: ['player-andy'],
          createdAt: '2026-07-15T10:20:00.000Z',
        },
      ],
      playerDayNotes: [
        {
          day: 1,
          playerId: 'player-andy',
          notes: [],
          updatedAt: '2026-07-15T10:20:00.000Z',
        },
      ],
    };

    const result = migrateObjectIds({
      friends: [{ id: 'friend-old', name: 'Andy', createdAt: game.createdAt }],
      games: [game],
    });
    const migratedGame = result.games?.[0];

    expect(migratedGame?.players.map((player) => player.id)).toEqual(['app-user', 'andy']);
    expect(migratedGame?.conversations[0]).toMatchObject({
      initiatorId: 'andy',
      participantIds: ['app-user', 'andy'],
      voterIds: ['andy'],
    });
    expect(migratedGame?.playerDayNotes?.[0].playerId).toBe('andy');
  });

  it('migrates legacy app-user markers and references without retaining the boolean', () => {
    const createdAt = '2026-07-15T10:20:30.000Z';
    const legacyGame = {
      id: 'game-old',
      activeDay: 1,
      createdAt,
      updatedAt: createdAt,
      players: [
        {
          id: 'player-legacy-app',
          isAppUser: true,
          name: 'Keeper',
          seat: 0,
          death: { day: 1, kind: 'night', updatedAt: createdAt, killerPlayerId: 'player-andy' },
        },
        {
          id: 'player-andy',
          name: 'Andy',
          seat: 1,
          roleAssignments: [
            {
              day: 1,
              kind: 'rumor',
              roleIds: [],
              subjectPlayerId: 'player-legacy-app',
              updatedAt: createdAt,
            },
          ],
        },
      ],
      conversations: [
        {
          id: 'conversation-old',
          day: 1,
          participantIds: ['player-legacy-app', 'player-andy'],
          initiatorId: 'player-legacy-app',
          voterIds: ['player-andy'],
          createdAt,
        },
      ],
      playerDayNotes: [
        {
          day: 1,
          playerId: 'player-legacy-app',
          notes: [],
          updatedAt: createdAt,
        },
      ],
    } as unknown as Game;
    const nameMatchedGame = {
      ...legacyGame,
      id: 'game-name-match',
      players: [{ id: 'player-name-app', name: 'Keeper', seat: 0 }],
      conversations: [],
      playerDayNotes: [],
    } as unknown as Game;

    const result = migrateObjectIds({
      appUserName: 'Keeper',
      games: [legacyGame, nameMatchedGame],
    });
    const migratedGame = result.games?.[0];

    expect(migratedGame?.players.map((player) => player.id)).toEqual(['app-user', 'player-andy']);
    expect(migratedGame?.players.every((player) => !('isAppUser' in player))).toBe(true);
    expect(migratedGame?.conversations[0]).toMatchObject({
      initiatorId: 'app-user',
      participantIds: ['app-user', 'player-andy'],
      voterIds: ['player-andy'],
    });
    expect(migratedGame?.players[0].death?.killerPlayerId).toBe('player-andy');
    expect(migratedGame?.players[1].roleAssignments?.[0].subjectPlayerId).toBe('app-user');
    expect(migratedGame?.playerDayNotes?.[0].playerId).toBe('app-user');
    expect(result.games?.[1].players[0].id).toBe('app-user');
  });

  it('migrates conversations to timestamp IDs and preserves their order and fields', () => {
    const createdAt = '2026-07-15T10:20:30.123Z';
    const game: Game = {
      id: 'game-old',
      activeDay: 1,
      createdAt,
      updatedAt: createdAt,
      players: [],
      conversations: [
        {
          id: 'conversation-old-1',
          day: 1,
          kind: 'interaction',
          participantIds: ['player-a', 'player-b'],
          initiatorId: 'player-a',
          createdAt,
        },
        {
          id: 'conversation-old-2',
          day: 2,
          kind: 'nomination',
          participantIds: ['player-c', 'player-d'],
          initiatorId: 'player-c',
          voterIds: ['player-d'],
          createdAt,
        },
      ],
    };

    const result = migrateObjectIds({ games: [game] });

    expect(result.games?.[0].conversations).toEqual([
      expect.objectContaining({
        id: 'conversation-20260715102030',
        day: 1,
        kind: 'interaction',
        createdAt,
      }),
      expect.objectContaining({
        id: 'conversation-20260715102030-2',
        day: 2,
        kind: 'nomination',
        voterIds: ['player-d'],
        createdAt,
      }),
    ]);
  });

  it('preserves a game ID while its script is waiting for a redownload', () => {
    const game: Game = {
      id: 'extension-cord-202607151020',
      activeDay: 1,
      createdAt: '2026-07-15T10:20:00.000Z',
      updatedAt: '2026-07-15T10:20:00.000Z',
      players: [],
      conversations: [],
      scriptId: '947-extension-cord',
    };
    const placeholder: StoredScript = {
      id: '947-extension-cord',
      name: 'Extension Cord',
      remoteId: 947,
      roles: [],
      updatedAt: '',
      version: '',
    };

    const result = migrateObjectIds({ games: [game], scripts: [placeholder] });

    expect(result.games?.[0]).toMatchObject({
      id: game.id,
      scriptId: placeholder.id,
    });
  });
});
