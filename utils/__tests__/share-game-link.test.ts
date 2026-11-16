import { deflateSync, strToU8 } from 'fflate';

import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { mergeGameTransfer } from '@/utils/game-transfer';
import {
  createSharedGame,
  createSharedGameTransfer,
  createShareGameUrl,
  decodeSharedGame,
  encodeSharedGame,
  findExistingSharedGame,
  findSharedPlayerIndex,
  getQuarterTurnsToBottom,
  getSharedCharacterCounts,
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

    expect(url.startsWith('https://grim-keeper.expo.app/s?g=')).toBe(true);
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

  it('sends an unchanged downloaded script by id and packs a 12 player game short', () => {
    const roles = tbRoleIds.map((id) => ({ id, name: id, team: 'townsfolk' }));
    const tb: StoredScript = {
      author: 'The Pandemonium Institute',
      id: 'trouble-brewing',
      name: 'Trouble Brewing',
      remoteId: 178,
      roles,
      updatedAt: createdAt,
      version: '1',
    };
    const game = createBigGame({ ...tb, roles: [...roles].reverse() });
    const shared = createSharedGame(game, [tb], roles, 'DJ');
    const url = createShareGameUrl(shared, 'https://grim-keeper.expo.app');
    const decoded = decodeSharedGame(new URL(url).searchParams.get('g') as string);

    expect(decoded.r).toEqual({ id: 'trouble-brewing', remoteId: 178 });
    expect(decoded.s).toBeUndefined();
    expect(decoded.c).toBe(createdAt);
    expect(decoded.p).toHaveLength(13);
    expect(decoded.p[12]).toEqual(['Story', -1, 201, 301, 1]);
    for (const [index, player] of decoded.p.slice(0, 12).entries()) {
      const source = game.players[index].position;
      expect(Math.abs(player[2] - (source?.x ?? 0))).toBeLessThanOrEqual(1);
      expect(Math.abs(player[3] - (source?.y ?? 0))).toBeLessThanOrEqual(2);
    }
    expect(url.length).toBeLessThan(260);

    // A friend without the script gets an empty copy that the app downloads by its id.
    const placeholder = createSharedGameTransfer(decoded, 3, 'Carol').data.script;
    expect(placeholder).toMatchObject({ id: 'trouble-brewing', remoteId: 178, roles: [] });
    expect(placeholder?.name).toBe('Trouble Brewing');
    // A friend who has it uses their own copy.
    const local = createSharedGameTransfer(decoded, 3, 'Carol', [tb]).data.game.script;
    expect(local?.roles).toHaveLength(tbRoleIds.length);
  });

  it('sends the full script when the game changed its characters', () => {
    const roles = tbRoleIds.map((id) => ({ id, name: id, team: 'townsfolk' }));
    const tb: StoredScript = {
      id: 'trouble-brewing',
      name: 'Trouble Brewing',
      remoteId: 178,
      roles,
      updatedAt: createdAt,
      version: '1',
    };
    const shared = createSharedGame(
      createBigGame({ ...tb, roles: roles.slice(1) }),
      [tb],
      [],
      'DJ',
    );

    expect(shared.r).toBeUndefined();
    expect(shared.s?.roles).toHaveLength(tbRoleIds.length - 1);
  });

  it('still opens links made before the packed format', () => {
    const legacy = {
      c: createdAt,
      h: 500,
      p: [
        ['DJ', 0, 250, 455],
        ['Alice', 1, 455, 250],
      ],
      s: { id: 'custom-script', name: 'Custom Script', roles: ['chef'], version: '1' },
      v: 1,
      w: 500,
    };
    const value = btoa(String.fromCharCode(...deflateSync(strToU8(JSON.stringify(legacy)))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    expect(decodeSharedGame(value).p.map((player) => player[0])).toEqual(['DJ', 'Alice']);
  });

  it('carries the starting character counts only when set by hand', () => {
    const standard = createSharedGame(createBigGame(script), [], [], 'DJ');
    expect(standard.k).toBeUndefined();
    expect(getSharedCharacterCounts(standard)).toEqual({
      demons: 1,
      minions: 2,
      outsiders: 2,
      townsfolk: 7,
    });

    const custom = createSharedGame(
      {
        ...createBigGame(script),
        characterTypeCounts: { demons: 1, minions: 3, outsiders: 1, townsfolk: 7 },
      },
      [],
      [],
      'DJ',
    );
    const decoded = decodeSharedGame(encodeSharedGame(custom));
    expect(decoded.k).toEqual([7, 1, 3, 1]);
    expect(createSharedGameTransfer(decoded, 0, 'DJ').data.game.characterTypeCounts).toEqual({
      demons: 1,
      minions: 3,
      outsiders: 1,
      townsfolk: 7,
    });
  });

  it('rejects a broken link', () => {
    expect(() => decodeSharedGame('not-a-game')).toThrow('This share link is broken');
  });
});

const tbRoleIds = [
  'washerwoman',
  'librarian',
  'investigator',
  'chef',
  'empath',
  'fortuneteller',
  'undertaker',
  'monk',
  'ravenkeeper',
  'virgin',
  'slayer',
  'soldier',
  'mayor',
  'butler',
  'drunk',
  'recluse',
  'saint',
  'poisoner',
  'spy',
  'scarletwoman',
  'baron',
  'imp',
];

function createBigGame(gameScript: StoredScript): Game {
  const names = [
    'DJ',
    'Alice',
    'Bobby',
    'Carol',
    'Dave',
    'Eve',
    'Frank',
    'Grace',
    'Heidi',
    'Ivan',
    'Judy',
    'Mallory',
  ];

  return {
    activeDay: 1,
    conversations: [],
    createdAt,
    id: 'big',
    mapHeight: 600,
    mapWidth: 400,
    players: [
      ...names.map((name, seat) => ({
        id: seat === 0 ? APP_USER_ID : `p${seat}`,
        name,
        position: {
          x: 200 + Math.round(155 * Math.sin(seat)),
          y: 300 + Math.round(255 * Math.cos(seat)),
        },
        seat,
      })),
      { id: 'story', isStoryteller: true, name: 'Story', position: { x: 200, y: 300 }, seat: -1 },
    ],
    script: gameScript,
    scriptId: gameScript.id,
    startingNight: 1,
    tokenSize: 90,
    updatedAt: createdAt,
  };
}

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
