import { createBackup, parseBackup } from '@/utils/data-transfer';
import { APP_USER_ID } from '@/utils/object-id';

declare const require: (moduleName: string) => {
  readFileSync: (path: string, encoding: 'utf8') => string;
  writeFileSync: (path: string, data: string) => void;
};

const { readFileSync, writeFileSync } = require('node:fs');

const inputPath = process.env.GRIM_KEEPER_BACKUP_PATH;
const outputPath = process.env.GRIM_KEEPER_BACKUP_OUTPUT_PATH;

describe('backup export integration', () => {
  const testBackup = inputPath && outputPath ? it : it.skip;

  testBackup('converts the supplied backup to the optimized format', () => {
    if (!inputPath || !outputPath) {
      return;
    }

    const input = readFileSync(inputPath, 'utf8');
    const sourceData = parseBackup(input);
    const compactOutput = createBackup(sourceData);
    const exported = JSON.parse(compactOutput) as {
      data: {
        appUserName: string;
        games: Array<{
          players: Array<{
            id: string;
            name?: string;
            position?: { x: number; y: number };
            [key: string]: unknown;
          }>;
          conversations: Array<{
            id: string;
            createdAt: string;
            participantIds: string[];
            initiatorId?: string;
          }>;
          lorics?: unknown[];
          script?: unknown;
          scriptId?: string;
          scriptRoleOverrides?: unknown[];
        }>;
        roleCatalog: Array<{ edition?: string }>;
        scripts: Array<unknown>;
      };
      version: number;
    };
    const output = JSON.stringify(exported, null, 2);

    writeFileSync(outputPath, output);

    expect(exported.version).toBe(2);
    expect(exported.data.roleCatalog).toEqual([]);
    expect(exported.data.games.filter((game) => game.scriptId)).not.toHaveLength(0);
    expect(exported.data.games.every((game) => game.script === undefined)).toBe(true);
    expect(
      exported.data.games.every((game) => game.players.some((player) => player.id === APP_USER_ID)),
    ).toBe(true);
    expect(
      exported.data.games.every((game) => game.players.every((player) => !('isAppUser' in player))),
    ).toBe(true);
    expect(
      exported.data.games.every((game) => game.players.every((player) => !('name' in player))),
    ).toBe(true);
    expect(
      exported.data.games.every((game) =>
        game.players.every(
          (player) =>
            !player.position ||
            [player.position.x, player.position.y].every(
              (value) => value === Number(value.toFixed(2)),
            ),
        ),
      ),
    ).toBe(true);
    expect(
      exported.data.games.every((game) =>
        game.conversations.every((conversation) =>
          /^conversation-\d{14}(?:-\d+)?$/.test(conversation.id),
        ),
      ),
    ).toBe(true);
    expect(
      exported.data.games.every((game) =>
        game.conversations.every((conversation) => !('initiatorId' in conversation)),
      ),
    ).toBe(true);
    expect(
      exported.data.games.every(
        (game) =>
          new Set(game.conversations.map((conversation) => conversation.id)).size ===
          game.conversations.length,
      ),
    ).toBe(true);
    expect(
      exported.data.games
        .flatMap((game) => game.scriptRoleOverrides ?? [])
        .every((roleId) => typeof roleId === 'string'),
    ).toBe(true);
    expect(
      exported.data.games
        .flatMap((game) => game.lorics ?? [])
        .every((roleId) => typeof roleId === 'string'),
    ).toBe(true);
    expect(
      exported.data.games.every((game) =>
        game.players.every(
          (player) => player.id === APP_USER_ID || !player.id.startsWith('player-'),
        ),
      ),
    ).toBe(true);
    expect(exported.data.scripts.some((script) => typeof script === 'string')).toBe(true);
    expect(exported.data.scripts.some((script) => typeof script === 'object')).toBe(true);
    const restored = parseBackup(output);
    expect(restored.games).toHaveLength(sourceData.games.length);
    expect(restored.games.every((game) => game.players.every((player) => player.name))).toBe(true);
    expect(
      restored.games.every((game) =>
        game.conversations.every(
          (conversation) => conversation.initiatorId === conversation.participantIds[0],
        ),
      ),
    ).toBe(true);
  });
});
