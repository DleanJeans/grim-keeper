import type { GameData } from '@/store/game-store';
import type { Game, Role, StoredScript } from '@/types/game';
import {
  addMissingFriendsForGames,
  getRoleIds,
  mapGamePlayerIdsToFriendIds,
} from '@/utils/object-id';

const backupFormat = 'grim-keeper-backup';
const backupVersion = 2;
const legacyBackupVersion = 1;
const officialScriptAuthor = 'The Pandemonium Institute';
const officialRoleEditions = new Set([
  'bad moon rising',
  'bmr',
  'carousel',
  'fabled',
  'loric',
  'sects and violets',
  'snv',
  'tb',
  'trouble brewing',
]);

type Backup = {
  data: ExportedGameData;
  exportedAt: string;
  format: typeof backupFormat;
  version: typeof backupVersion;
};

type ExportedGame = Omit<Game, 'script'> & {
  scriptId?: string;
  scriptRoleIds?: string[];
  scriptRoleOverrides?: string[];
};

type ExportedGameData = Omit<GameData, 'games' | 'scripts'> & {
  games: ExportedGame[];
  scripts: ExportedScript[];
};

type ExportedScript = StoredScript | string;

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
  const scripts: ExportedScript[] = data.scripts.map((script) =>
    isImportedScript(script) ? script : script.id,
  );
  const roleCatalog = data.roleCatalog.filter((role) => !isOfficialRole(role));
  const scriptsById = new Map(data.scripts.map((script) => [script.id, script]));
  const friends = addMissingFriendsForGames(data.friends, data.games, data.appUserName);
  const games = data.games.map((game) =>
    mapGamePlayerIdsToFriendIds(game, friends, data.appUserName),
  );

  for (const game of games) {
    const script = game.script;
    if (!script) {
      continue;
    }

    if (!scriptsById.has(script.id)) {
      scripts.push(isImportedScript(script) ? script : script.id);
      scriptsById.set(script.id, script);
    }
  }

  return {
    ...data,
    friends,
    games: games.map((game) => exportGame(game, scriptsById)),
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
  const scriptRoleOverrides = storedScript
    ? script.roles
        .filter((role) => !storedScript.roles.some((storedRole) => storedRole.id === role.id))
        .map((role) => role.id)
    : undefined;

  return {
    ...gameWithoutScript,
    scriptId: script.id,
    ...(scriptRoleIds ? { scriptRoleIds } : {}),
    ...(scriptRoleOverrides?.length ? { scriptRoleOverrides } : {}),
  };
}

function restoreExportedData(data: ExportedGameData): GameData {
  const storedScripts = data.scripts.map((script) =>
    typeof script === 'string' ? createScriptPlaceholder(script) : script,
  );
  const scriptsById = new Map(
    storedScripts.filter((script) => script.roles.length > 0).map((script) => [script.id, script]),
  );
  const rolesById = new Map<string, Role>();

  for (const role of data.roleCatalog) {
    rolesById.set(role.id, role);
  }
  for (const script of storedScripts) {
    for (const role of script.roles) {
      rolesById.set(role.id, role);
    }
  }

  return {
    ...data,
    scripts: storedScripts,
    games: data.games.map((game) => {
      const { scriptId, scriptRoleIds, scriptRoleOverrides, ...gameWithoutScriptReference } = game;
      const script = scriptId ? scriptsById.get(scriptId) : undefined;

      if (!script) {
        return {
          ...gameWithoutScriptReference,
          ...(scriptId ? { scriptId } : {}),
          ...(scriptRoleIds ? { scriptRoleIds } : {}),
          ...(scriptRoleOverrides?.length
            ? { scriptRoleOverrides: getRoleIds(scriptRoleOverrides) }
            : {}),
        };
      }

      const overrideRoleIds = getRoleIds(scriptRoleOverrides);
      const roles = scriptRoleIds
        ? scriptRoleIds.flatMap((roleId) => {
            const role = rolesById.get(roleId);
            return role ? [role] : [];
          })
        : script.roles;

      return {
        ...gameWithoutScriptReference,
        ...(scriptId ? { scriptId } : {}),
        ...(scriptRoleIds?.length ? { scriptRoleIds } : {}),
        ...(overrideRoleIds.length ? { scriptRoleOverrides: overrideRoleIds } : {}),
        script: { ...script, roles: [...roles] },
      };
    }),
  };
}

function isImportedScript(script: StoredScript) {
  return (
    script.roles.length > 0 &&
    script.remoteId === undefined &&
    script.author !== officialScriptAuthor
  );
}

function createScriptPlaceholder(id: string): StoredScript {
  const remoteIdMatch = /^(\d+)-/.exec(id);
  const remoteId = remoteIdMatch ? Number(remoteIdMatch[1]) : undefined;
  const name = remoteIdMatch ? id.slice(remoteIdMatch[0].length) : id;

  return {
    id,
    name,
    remoteId,
    roles: [],
    updatedAt: '',
    version: '',
  };
}

function isOfficialRole(role: Role) {
  return officialRoleEditions.has(role.edition?.trim().toLocaleLowerCase() ?? '');
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
