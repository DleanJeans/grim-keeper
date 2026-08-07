import { createBackup, parseBackup } from '@/utils/data-transfer';

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
          players: Array<{ id: string; isAppUser?: boolean; name: string }>;
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
          (player) =>
            player.isAppUser ||
            player.name === exported.data.appUserName ||
            !player.id.startsWith('player-'),
        ),
      ),
    ).toBe(true);
    expect(exported.data.scripts.some((script) => typeof script === 'string')).toBe(true);
    expect(exported.data.scripts.some((script) => typeof script === 'object')).toBe(true);
    expect(parseBackup(output).games).toHaveLength(sourceData.games.length);
  });
});
