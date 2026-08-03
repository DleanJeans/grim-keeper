import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import { createBackup, parseBackup } from '@/utils/data-transfer';

const data: GameData = {
  appUserName: 'Keeper',
  friends: [],
  games: [],
  roleCatalog: [],
  savedNotes: [],
  scripts: [],
};

describe('data transfer', () => {
  it('round trips all persisted data', () => {
    expect(parseBackup(createBackup(data))).toEqual(data);
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseBackup('{"games":[]}')).toThrow(
      'This is not a supported Grim Keeper backup.',
    );
  });

  it('rejects a backup missing required data', () => {
    expect(() => parseBackup('{"format":"grim-keeper-backup","version":1,"data":{}}')).toThrow(
      'The backup is missing required Grim Keeper data.',
    );
  });

  it('exports game script references instead of cloned script objects', () => {
    const role: Role = { id: 'washerwoman', name: 'Washerwoman' };
    const script: StoredScript = {
      id: 'script-1',
      name: 'Trouble Brewing',
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      script,
    };

    const backup = JSON.parse(
      createBackup({ ...data, games: [game], scripts: [script], roleCatalog: [role] }),
    );

    expect(backup.version).toBe(2);
    expect(backup.data.games[0]).toMatchObject({ scriptId: 'script-1' });
    expect(backup.data.games[0].script).toBeUndefined();
    expect(parseBackup(JSON.stringify(backup)).games[0]).toMatchObject({
      scriptId: script.id,
      script,
    });
  });

  it('preserves game-specific script roles with compact role references', () => {
    const baseRole: Role = { edition: 'tb', id: 'washerwoman', name: 'Washerwoman' };
    const travelerRole: Role = { edition: 'tb', id: 'gunslinger', name: 'Gunslinger' };
    const script: StoredScript = {
      id: 'script-1',
      name: 'Trouble Brewing',
      roles: [baseRole],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'game-1',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      script: { ...script, roles: [baseRole, travelerRole] },
    };
    const customRole: Role = { edition: 'homebrew', id: 'custom', name: 'Custom' };
    const gameData = {
      ...data,
      games: [game],
      roleCatalog: [travelerRole, customRole],
      scripts: [script],
    };

    const backup = JSON.parse(createBackup(gameData));
    const restoredGame = parseBackup(JSON.stringify(backup)).games[0];

    expect(backup.data.games[0]).toMatchObject({
      scriptId: 'script-1',
      scriptRoleIds: ['washerwoman', 'gunslinger'],
      scriptRoleOverrides: [travelerRole],
    });
    expect(backup.data.roleCatalog).toEqual([customRole]);
    expect(restoredGame.script?.roles.map((role) => role.id)).toEqual([
      'washerwoman',
      'gunslinger',
    ]);
  });

  it('exports imported scripts fully and BotC scripts as IDs', () => {
    const role: Role = { id: 'imp', name: 'Imp' };
    const importedScript: StoredScript = {
      author: 'Homebrew Author',
      id: 'custom-script',
      name: 'Custom Script',
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const downloadedScript: StoredScript = {
      id: '947-extension-cord',
      name: 'Extension Cord',
      remoteId: 947,
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const officialScript: StoredScript = {
      author: 'The Pandemonium Institute',
      id: 'trouble-brewing',
      name: 'Trouble Brewing',
      remoteId: 178,
      roles: [role],
      updatedAt: '2026-08-03T00:00:00.000Z',
      version: '1',
    };
    const game: Game = {
      id: 'extension-cord-202608030000',
      activeDay: 1,
      createdAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      players: [],
      conversations: [],
      scriptId: downloadedScript.id,
      script: downloadedScript,
    };

    const backup = JSON.parse(
      createBackup({
        ...data,
        games: [game],
        scripts: [importedScript, downloadedScript, officialScript],
      }),
    );

    expect(backup.data.scripts).toEqual([importedScript, downloadedScript.id, officialScript.id]);
    expect(backup.data.games[0]).toMatchObject({ scriptId: downloadedScript.id });
    expect(backup.data.games[0].script).toBeUndefined();

    const restored = parseBackup(JSON.stringify(backup));
    expect(restored.scripts[0]).toEqual(importedScript);
    expect(restored.scripts.slice(1)).toEqual([
      expect.objectContaining({ id: downloadedScript.id, remoteId: 947, roles: [] }),
      expect.objectContaining({ id: officialScript.id, roles: [] }),
    ]);
    expect(restored.games[0]).toMatchObject({ scriptId: downloadedScript.id });
    expect(restored.games[0].script).toBeUndefined();
  });

  it('imports version 1 backups', () => {
    const legacyBackup = JSON.stringify({
      data,
      exportedAt: '2026-08-03T00:00:00.000Z',
      format: 'grim-keeper-backup',
      version: 1,
    });

    expect(parseBackup(legacyBackup)).toEqual(data);
  });
});
