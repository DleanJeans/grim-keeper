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
            kind?: 'interaction' | 'nomination';
          }>;
          playerDayNotes?: Array<{ notes: Array<{ id: string; createdAt: string }> }>;
          lorics?: unknown[];
          script?: unknown;
          scriptId?: string;
          scriptRoleIds?: string[];
          scriptRoleOverrides?: unknown[];
        }>;
        roleCatalog: Array<{ edition?: string }>;
        scripts: Array<unknown>;
        savedNotes: Array<{ id: string; createdAt: string }>;
      };
      version: number;
    };
    const output = JSON.stringify(exported, null, 2);

    writeFileSync(outputPath, output);

    expect(exported.version).toBe(2);
    expect(exported.data.roleCatalog).toEqual([]);
    expect(
      exported.data.scripts.some(
        (script) =>
          typeof script === 'object' &&
          script !== null &&
          'id' in script &&
          script.id === 'sushi-buffet',
      ),
    ).toBe(false);
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
      exported.data.games
        .flatMap((game) => game.playerDayNotes?.flatMap((entry) => entry.notes) ?? [])
        .every((note) => /^note-\d{14}(?:-\d+)?$/.test(note.id)),
    ).toBe(true);
    expect(
      exported.data.savedNotes.every((note) => /^saved-note-\d{14}(?:-\d+)?$/.test(note.id)),
    ).toBe(true);
    expect(
      exported.data.games.every((game) =>
        game.conversations.every((conversation) => conversation.kind !== 'interaction'),
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
    const portableScripts = new Map(
      exported.data.scripts
        .filter(
          (script): script is { id: string; roles: unknown[] } =>
            typeof script === 'object' &&
            script !== null &&
            'id' in script &&
            typeof script.id === 'string' &&
            'roles' in script &&
            Array.isArray(script.roles),
        )
        .map((script) => [script.id, script]),
    );
    for (const scriptId of [
      'chaoswille-v1-8-proclaimer',
      'no-rest-for-the-wicked',
      'repugnance-oblivion',
    ]) {
      expect(portableScripts.get(scriptId)?.roles.every((role) => typeof role === 'string')).toBe(
        true,
      );
    }
    expect(portableScripts.get('chaoswille-v1-8-proclaimer')?.roles).toEqual(
      expect.arrayContaining(['tor', 'bootlegger', 'hellslibrarian']),
    );
    expect(portableScripts.get('chaoswille-v1-8-proclaimer')?.roles).toEqual(
      expect.arrayContaining(['bountyhunter', 'fortuneteller', 'eviltwin']),
    );
    expect(portableScripts.get('repugnance-oblivion')?.roles).toEqual(
      expect.arrayContaining(['devilsadvocate']),
    );
    expect(portableScripts.get('no-rest-for-the-wicked')?.roles).toEqual(
      expect.arrayContaining([
        'bountyhunter',
        'highpriestess',
        'villageidiot',
        'tealady',
        'pithag',
        'scarletwoman',
        'alhadikhia',
      ]),
    );
    expect(
      portableScripts.get('gavin-s-birthday')?.roles.every((role) => typeof role === 'object'),
    ).toBe(true);
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
    expect(
      restored.games.every((game) =>
        game.conversations.every(
          (conversation) =>
            conversation.kind === 'interaction' || conversation.kind === 'nomination',
        ),
      ),
    ).toBe(true);
    for (const [scriptId, roleNames] of Object.entries({
      'chaoswille-v1-8-proclaimer': {
        bountyhunter: 'Bounty Hunter',
        eviltwin: 'Evil Twin',
        fortuneteller: 'Fortune Teller',
        hellslibrarian: "Hell's Librarian",
      },
      'no-rest-for-the-wicked': {
        alhadikhia: 'Al-Hadikhia',
        bountyhunter: 'Bounty Hunter',
        highpriestess: 'High Priestess',
        pithag: 'Pit-Hag',
        scarletwoman: 'Scarlet Woman',
        tealady: 'Tea Lady',
        villageidiot: 'Village Idiot',
      },
      'repugnance-oblivion': { devilsadvocate: "Devil's Advocate" },
    })) {
      const restoredScript = restored.scripts.find((script) => script.id === scriptId);
      for (const [roleId, name] of Object.entries(roleNames)) {
        expect(restoredScript?.roles.find((role) => role.id === roleId)?.name).toBe(name);
      }
    }
    const sourceSushiGames = sourceData.games.filter((game) => game.scriptId === 'sushi-buffet');
    const restoredSushiGames = restored.games.filter((game) => game.scriptId === 'sushi-buffet');
    expect(restoredSushiGames).toHaveLength(sourceSushiGames.length);
    for (const sourceGame of sourceSushiGames) {
      const restoredGame = restoredSushiGames.find((game) => game.id === sourceGame.id);
      expect(restoredGame?.sushiRoleIds).toEqual(sourceGame.sushiRoleIds);
      expect(restoredGame?.script?.id).toBe('sushi-buffet');
      expect(restoredGame?.script?.roles.map((role) => role.id)).toEqual(
        sourceGame.script?.roles.map((role) => role.id),
      );
    }
  });
});
