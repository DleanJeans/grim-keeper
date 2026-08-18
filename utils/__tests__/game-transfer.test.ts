import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import { createGameTransfer, mergeGameTransfer, parseGameTransfer } from '@/utils/game-transfer';
import { APP_USER_ID } from '@/utils/object-id';

const role: Role = {
  ability: 'You learn something useful.',
  edition: 'homebrew',
  id: 'custom-role',
  name: 'Custom Role',
  team: 'townsfolk',
};

const script: StoredScript = {
  author: 'Homebrew Author',
  id: 'custom-script',
  name: 'Custom Script',
  roles: [role],
  updatedAt: '2026-08-18T00:00:00.000Z',
  version: '1',
};

describe('game transfer', () => {
  it('round trips the complete game and script', () => {
    const game = createGame();
    const transfer = parseGameTransfer(createGameTransfer(game, [script]));

    expect(transfer.data.game).toEqual(game);
    expect(transfer.data.script).toEqual(script);
  });

  it('rejects a game export when its referenced script is unavailable', () => {
    const game = { ...createGame(), script: undefined };

    expect(() => createGameTransfer(game, [])).toThrow(
      'The script used by this game is not available to export.',
    );
  });

  it('rejects malformed transfers and transfers missing their script', () => {
    expect(() => parseGameTransfer('not json')).toThrow(
      'This is not a valid Grim Keeper game transfer.',
    );

    const incomplete = JSON.stringify({
      data: { game: createGame() },
      exportedAt: '2026-08-18T00:00:00.000Z',
      format: 'grim-keeper-game',
      version: 1,
    });

    expect(() => parseGameTransfer(incomplete)).toThrow(
      'The game transfer is missing the script used by this game.',
    );
  });

  it('reuses an existing script and remaps player references to local friends', () => {
    const game = createGame({
      aliceId: 'source-alice',
      bobId: 'source-bob',
    });
    const source = parseGameTransfer(createGameTransfer(game, [script]));
    const data = createData({
      friends: [{ createdAt: game.createdAt, id: 'alice', name: 'Alice' }],
      scripts: [script],
    });

    const result = mergeGameTransfer(data, source);
    const imported = result.games[0];

    expect(result.scripts).toHaveLength(1);
    expect(imported.players.map((player) => player.id)).toEqual([APP_USER_ID, 'alice', 'bob']);
    expect(imported.players[0].name).toBe('Keeper');
    expect(imported.conversations[0].participantIds).toEqual([APP_USER_ID, 'alice', 'bob']);
    expect(imported.conversations[0].initiatorId).toBe('alice');
    expect(imported.playerDayNotes?.[0].playerId).toBe('alice');
    expect(result.friends.map((friend) => friend.name)).toEqual(['Alice', 'Bob']);
  });

  it('reuses a matching remote script and fills an empty placeholder', () => {
    const importedScript = { ...script, id: '42-custom-script', remoteId: 42 };
    const placeholder = { ...importedScript, id: 'local-script', roles: [] };
    const game = createGame({ script: importedScript });
    const transfer = parseGameTransfer(createGameTransfer(game, [importedScript]));

    const result = mergeGameTransfer(createData({ scripts: [placeholder] }), transfer);

    expect(result.scripts).toHaveLength(1);
    expect(result.scripts[0]).toMatchObject({ id: 'local-script', roles: [role] });
    expect(result.games[0].scriptId).toBe('local-script');
  });

  it('adds a new game on repeated imports without duplicating the script', () => {
    const transfer = parseGameTransfer(createGameTransfer(createGame(), [script]));
    const first = mergeGameTransfer(createData(), transfer);
    const second = mergeGameTransfer(first, transfer);

    expect(second.games).toHaveLength(2);
    expect(second.games[0].id).not.toBe(second.games[1].id);
    expect(second.scripts).toHaveLength(1);
  });
});

function createData(overrides: Partial<GameData> = {}): GameData {
  return {
    appUserName: 'Keeper',
    friends: [],
    games: [],
    roleCatalog: [],
    savedNotes: [],
    scripts: [],
    ...overrides,
  };
}

function createGame({
  aliceId = 'alice',
  bobId = 'bob',
  script: gameScript = script,
}: {
  aliceId?: string;
  bobId?: string;
  script?: StoredScript;
} = {}): Game {
  const createdAt = '2026-08-18T00:00:00.000Z';
  const players = [
    { id: APP_USER_ID, name: 'Laptop Keeper', seat: 0 },
    { id: aliceId, name: 'Alice', seat: 1 },
    { id: bobId, name: 'Bob', seat: 2 },
  ];

  return {
    activeDay: 2,
    conversations: [
      {
        createdAt,
        day: 1,
        id: 'conversation-1',
        initiatorId: aliceId,
        kind: 'interaction',
        participantIds: [APP_USER_ID, aliceId, bobId],
        voterIds: [bobId],
      },
    ],
    createdAt,
    id: 'source-game',
    mapHeight: 600,
    mapWidth: 900,
    playerDayNotes: [
      {
        day: 1,
        notes: [
          {
            createdAt,
            id: 'note-1',
            text: 'Watch Alice.',
            updatedAt: createdAt,
          },
        ],
        playerId: aliceId,
        updatedAt: createdAt,
      },
    ],
    players,
    script: gameScript,
    scriptId: gameScript?.id,
    updatedAt: createdAt,
  };
}
