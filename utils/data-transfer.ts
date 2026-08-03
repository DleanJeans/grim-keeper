import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';

const backupFormat = 'grim-keeper-backup';
const backupVersion = 2;
const legacyBackupVersion = 1;

type Backup = {
  data: ExportedGameData;
  exportedAt: string;
  format: typeof backupFormat;
  version: typeof backupVersion;
};

type ExportedGame = Omit<Game, 'script'> & {
  scriptId?: string;
  scriptRoleIds?: string[];
};

type ExportedGameData = Omit<GameData, 'games'> & {
  games: ExportedGame[];
};

export function createBackup(data: GameData) {
  const exportedData = normalizeForExport(data);
  const backup: Backup = {
    data: exportedData,
    exportedAt: new Date().toISOString(),
    format: backupFormat,
    version: backupVersion,
  };

  return JSON.stringify(backup);
}

export function parseBackup(value: string): GameData {
  const backup: unknown = JSON.parse(value);

  if (!isRecord(backup) || backup.format !== backupFormat) {
    throw new Error('This is not a supported Grim Keeper backup.');
  }

  if (backup.version === legacyBackupVersion) {
    if (!isGameData(backup.data)) {
      throw new Error('The backup is missing required Grim Keeper data.');
    }

    return backup.data;
  }

  if (backup.version !== backupVersion || !isExportedGameData(backup.data)) {
    throw new Error('The backup is missing required Grim Keeper data.');
  }

  return restoreExportedData(backup.data);
}

function normalizeForExport(data: GameData): ExportedGameData {
  const scripts = [...data.scripts];
  const roleCatalog = [...data.roleCatalog];
  const scriptsById = new Map(scripts.map((script) => [script.id, script]));
  const rolesById = new Map(roleCatalog.map((role) => [role.id, role]));

  for (const game of data.games) {
    const script = game.script;
    if (!script) {
      continue;
    }

    if (!scriptsById.has(script.id)) {
      scripts.push(script);
      scriptsById.set(script.id, script);
    }

    const storedScript = scriptsById.get(script.id);
    for (const role of script.roles) {
      if (!storedScript?.roles.some((storedRole) => storedRole.id === role.id)) {
        addRoleIfMissing(roleCatalog, rolesById, role);
      }
    }
  }

  return {
    ...data,
    games: data.games.map((game) => exportGame(game, scriptsById)),
    roleCatalog,
    scripts,
  };
}

function exportGame(game: Game, scriptsById: Map<string, StoredScript>): ExportedGame {
  const { script, ...gameWithoutScript } = game;
  if (!script) {
    return gameWithoutScript;
  }

  const storedScript = scriptsById.get(script.id);
  const scriptRoleIds =
    storedScript && sameRoleIds(script.roles, storedScript.roles)
      ? undefined
      : script.roles.map((role) => role.id);

  return {
    ...gameWithoutScript,
    scriptId: script.id,
    ...(scriptRoleIds ? { scriptRoleIds } : {}),
  };
}

function restoreExportedData(data: ExportedGameData): GameData {
  const scriptsById = new Map(data.scripts.map((script) => [script.id, script]));
  const rolesById = new Map<string, Role>();

  for (const role of data.roleCatalog) {
    rolesById.set(role.id, role);
  }
  for (const script of data.scripts) {
    for (const role of script.roles) {
      rolesById.set(role.id, role);
    }
  }

  return {
    ...data,
    games: data.games.map((game) => {
      const { scriptId, scriptRoleIds, ...gameWithoutScriptReference } = game;
      const script = scriptId ? scriptsById.get(scriptId) : undefined;

      if (!script) {
        return gameWithoutScriptReference;
      }

      const roles = scriptRoleIds
        ? scriptRoleIds.flatMap((roleId) => {
            const role = rolesById.get(roleId);
            return role ? [role] : [];
          })
        : script.roles;

      return {
        ...gameWithoutScriptReference,
        script: { ...script, roles: [...roles] },
      };
    }),
  };
}

function addRoleIfMissing(roles: Role[], rolesById: Map<string, Role>, role: Role) {
  if (rolesById.has(role.id)) {
    return;
  }

  roles.push(role);
  rolesById.set(role.id, role);
}

function sameRoleIds(first: Role[], second: Role[]) {
  return (
    first.length === second.length && first.every((role, index) => role.id === second[index]?.id)
  );
}

function isGameData(value: unknown): value is GameData {
  return (
    isRecord(value) &&
    typeof value.appUserName === 'string' &&
    Array.isArray(value.friends) &&
    Array.isArray(value.games) &&
    Array.isArray(value.roleCatalog) &&
    Array.isArray(value.savedNotes) &&
    Array.isArray(value.scripts)
  );
}

function isExportedGameData(value: unknown): value is ExportedGameData {
  return (
    isRecord(value) &&
    typeof value.appUserName === 'string' &&
    Array.isArray(value.friends) &&
    Array.isArray(value.games) &&
    Array.isArray(value.roleCatalog) &&
    Array.isArray(value.savedNotes) &&
    Array.isArray(value.scripts)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
