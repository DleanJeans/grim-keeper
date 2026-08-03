import type { Game, SavedNote, StoredScript } from '@/types/game';
import { createFriendId, createGameId, createScriptId, migrateObjectIds } from '@/utils/object-id';

describe('object IDs', () => {
  it('creates URL-friendly IDs for new objects', () => {
    expect(createGameId('Trouble Brewing', '2026-07-15T10:20:00.000Z', [])).toBe(
      'trouble-brewing-202607151020',
    );
    expect(createFriendId('Andy O’Brien', [])).toBe('andy-o-brien');
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
      gameId: 'extension-cord-202607151020',
      scriptId: '42-extension-cord',
    });
  });

  it('maps existing player IDs to friend IDs and keeps references in sync', () => {
    const game: Game = {
      id: 'game-old',
      activeDay: 1,
      createdAt: '2026-07-15T10:20:00.000Z',
      updatedAt: '2026-07-15T10:20:00.000Z',
      players: [
        { id: 'player-app', isAppUser: true, name: 'Keeper', seat: 0 },
        { id: 'player-andy', name: 'Andy', seat: 1 },
      ],
      conversations: [
        {
          id: 'conversation-1',
          day: 1,
          participantIds: ['player-app', 'player-andy'],
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

    expect(migratedGame?.players.map((player) => player.id)).toEqual(['player-app', 'andy']);
    expect(migratedGame?.conversations[0]).toMatchObject({
      initiatorId: 'andy',
      participantIds: ['player-app', 'andy'],
      voterIds: ['andy'],
    });
    expect(migratedGame?.playerDayNotes?.[0].playerId).toBe('andy');
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
