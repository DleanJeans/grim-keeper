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
    expect(parseBackup(JSON.stringify(backup)).games[0].script).toEqual(script);
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
