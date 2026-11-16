import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { mergeGameTransfer } from '@/utils/game-transfer';
import {
  createSharedGame,
  createSharedGameTransfer,
  createShareGameUrl,
  decodeSharedGame,
  findExistingSharedGame,
  findSharedPlayerIndex,
  getQuarterTurnsToBottom,
} from '@/utils/share-game-link';

const customRole: Role = {
  ability: 'You learn something useful.',
  id: 'custom-role',
  name: 'Custom Role',
  notes: ['My private note'],
  team: 'townsfolk',
};

const script: StoredScript = {
  author: 'Homebrew Author',
  id: 'custom-script',
  name: 'Custom Script',
  roles: [customRole],
  updatedAt: '2026-08-18T00:00:00.000Z',
  version: '1',
};

const createdAt = '2026-11-15T19:00:00.000Z';

describe('share game link', () => {
  it('round trips players, positions and script through the URL without game notes', () => {
    const shared = createSharedGame(createGame(), [script], [], 'DJ');
    const url = createShareGameUrl(shared, 'https://grim-keeper.expo.app');
    const value = new URL(url).searchParams.get('g') as string;
    const decoded = decodeSharedGame(value);

    expect(url.startsWith('https://grim-keeper.expo.app/share?g=')).toBe(true);
    expect(decoded.p.map((player) => player[0])).toEqual(['DJ', 'Alice', 'Bob', 'Carol', 'Story']);
    expect(decoded.p[4][4]).toBe(1);
    expect(decoded.s?.name).toBe('Custom Script');
    expect(JSON.stringify(decoded)).not.toContain('My private note');
    expect(JSON.stringify(decoded)).not.toContain('Watch Alice');
    expect(JSON.stringify(decoded)).not.toContain('chef');
  });

  it('matches the app user by name and ignores the default name', () => {
    const shared = createSharedGame(createGame(), [script], [], 'DJ');

    expect(findSharedPlayerIndex(shared, ' bob ')).toBe(2);
    expect(findSharedPlayerIndex(shared, 'You')).toBeUndefined();
    expect(findSharedPlayerIndex(shared, 'Story')).toBeUndefined();
    expect(findSharedPlayerIndex(shared, 'Zed')).toBeUndefined();
  });

  it('turns the map until the picked player sits at the bottom', () => {
    expect(getQuarterTurnsToBottom({ x: 50, y: 95 }, 100, 100)).toBe(0);
    expect(getQuarterTurnsToBottom({ x: 95, y: 50 }, 100, 100)).toBe(1);
    expect(getQuarterTurnsToBottom({ x: 50, y: 5 }, 100, 100)).toBe(2);
    expect(getQuarterTurnsToBottom({ x: 5, y: 50 }, 100, 100)).toBe(3);

    const shared = createSharedGame(createGame(), [script], [], 'DJ');
    // Alice sits on the right edge.
    const transfer = createSharedGameTransfer(shared, 1, 'Alice');
    const alice = transfer.data.game.players.find((player) => player.id === APP_USER_ID);

    expect(alice?.name).toBe('Alice');
    expect(alice?.position?.y).toBeGreaterThan(400);
    expect(Math.abs((alice?.position?.x ?? 0) - 250)).toBeLessThan(30);
  });

  it('imports as a new game with the sharer as a friend and no claims', () => {
    const shared = decodeSharedGame(
      new URL(
        createShareGameUrl(createSharedGame(createGame(), [script], [], 'DJ'), 'https://x'),
      ).searchParams.get('g') as string,
    );
    const result = mergeGameTransfer(createData('Bob'), createSharedGameTransfer(shared, 2, 'Bob'));
    const game = result.games[0];

    expect(game.createdAt).toBe(createdAt);
    expect(game.players.find((player) => player.id === APP_USER_ID)?.name).toBe('Bob');
    expect(game.players.every((player) => !player.roleAssignments?.length)).toBe(true);
    expect(game.conversations).toEqual([]);
    expect(game.script?.roles[0]?.name).toBe('Custom Role');
    expect(result.friends.map((friend) => friend.name).sort()).toEqual([
      'Alice',
      'Carol',
      'DJ',
      'Story',
    ]);
    expect(result.scripts.map((stored) => stored.id)).toEqual(['custom-script']);
    expect(findExistingSharedGame(shared, result.games)?.id).toBe(game.id);
  });

  it('rejects a broken link', () => {
    expect(() => decodeSharedGame('not-a-game')).toThrow('This share link is broken');
  });
});

function createData(appUserName: string): GameData {
  return {
    appUserName,
    friends: [],
    games: [],
    roleCatalog: [],
    savedNotes: [],
    scripts: [],
  } as unknown as GameData;
}

function createGame(): Game {
  return {
    activeDay: 3,
    activePhase: 'day',
    conversations: [
      {
        createdAt,
        day: 1,
        id: 'conversation-1',
        initiatorId: 'alice',
        participantIds: [APP_USER_ID, 'alice'],
      },
    ],
    createdAt,
    id: 'source-game',
    mapHeight: 500,
    mapWidth: 500,
    playerDayNotes: [
      {
        day: 1,
        notes: [{ createdAt, id: 'note-1', text: 'Watch Alice.', updatedAt: createdAt }],
        playerId: 'alice',
        updatedAt: createdAt,
      },
    ],
    players: [
      { id: APP_USER_ID, name: 'Old name', position: { x: 250, y: 455 }, seat: 0 },
      {
        id: 'alice',
        name: 'Alice',
        position: { x: 455, y: 250 },
        roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: createdAt }],
        seat: 1,
      },
      { id: 'bob', name: 'Bob', position: { x: 250, y: 45 }, seat: 2 },
      { id: 'carol', name: 'Carol', position: { x: 45, y: 250 }, seat: 3 },
      { id: 'story', isStoryteller: true, name: 'Story', position: { x: 250, y: 250 }, seat: -1 },
    ],
    script,
    scriptId: script.id,
    startingNight: 1,
    updatedAt: createdAt,
  };
}
