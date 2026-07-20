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
});
