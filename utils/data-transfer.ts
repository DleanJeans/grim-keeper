import type { GameData } from '@/store/game-store';
import type { Conversation, Game, Player, Role, StoredScript } from '@/types/game';
import { isGameResult } from '@/utils/game-utils';
import {
  APP_USER_ID,
  addMissingFriendsForGames,
  getRoleIds,
  mapGameConversationIds,
  mapGamePlayerDayNoteIds,
  mapGamePlayerIdsToFriendIds,
  mapSavedNoteIds,
} from '@/utils/object-id';
import { isOfficialRole } from '@/utils/role-utils';
import { isSushiBuffetScript, SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-service';
import {
  normalizeRoleImagesInState,
  normalizeRoleImageUrls,
  restoreGameScripts,
  restoreStoredScript,
  restoreSushiBuffetScriptRoles,
  type SerializedStoredScript,
  serializeStoredScript,
} from '@/utils/script-storage';

const backupFormat = 'grim-keeper-backup';
const backupVersion = 2;
const legacyBackupVersion = 1;
const officialScriptAuthor = 'The Pandemonium Institute';

type Backup = {
  data: ExportedGameData;
  exportedAt: string;
  format: typeof backupFormat;
  version: typeof backupVersion;
};

type ExportedPlayer = Omit<Player, 'name'> & { name?: string };

type ExportedConversation = Omit<Conversation, 'initiatorId' | 'kind'> & {
  initiatorId?: string;
  kind?: Conversation['kind'];
};

type ExportedGame = Omit<Game, 'conversations' | 'players' | 'script'> & {
  conversations: ExportedConversation[];
  players: ExportedPlayer[];
  scriptId?: string;
  scriptRoleIds?: string[];
  scriptRoleOverrides?: string[];
};

type ExportedGameData = Omit<GameData, 'games' | 'scripts'> & {
  games: ExportedGame[];
  scripts: ExportedScript[];
};

type ExportedScript = SerializedStoredScript | string;

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

    return restoreLegacyData(backup.data);
  }

  if (backup.version !== backupVersion || !isExportedGameData(backup.data)) {
    throw new Error('The backup is missing required Grim Keeper data.');
  }

  return restoreExportedData(backup.data);
}

function normalizeForExport(data: GameData): ExportedGameData {
  const storedScripts = data.scripts.filter((script) => !isSushiBuffetScript(script));
  const scripts: ExportedScript[] = storedScripts.map((script) =>
    isPortableScript(script) ? serializeStoredScript(script, data.roleCatalog) : script.id,
  );
  const roleCatalog = data.roleCatalog
    .filter((role) => !isOfficialRole(role))
    .map(normalizeRoleImageUrls);
  const scriptsById = new Map(storedScripts.map((script) => [script.id, script]));
  const friends = addMissingFriendsForGames(data.friends, data.games, data.appUserName);
  const usedNoteIds: string[] = [];
  const games = data.games.map((game) => {
    const normalizedGame = mapGamePlayerDayNoteIds(
      mapGameConversationIds(mapGamePlayerIdsToFriendIds(game, friends, data.appUserName)),
      usedNoteIds,
    );

    return {
      ...normalizedGame,
      players: normalizedGame.players.map((player) => ({
        ...player,
        ...(player.position
          ? {
              position: {
                x: roundToTwoDecimals(player.position.x),
                y: roundToTwoDecimals(player.position.y),
              },
            }
          : {}),
      })),
    };
  });
  const savedNotes = mapSavedNoteIds(data.savedNotes, []);

  for (const game of games) {
    const script = game.script;
    if (!script) {
      continue;
    }

    if (isSushiBuffetScript(script)) {
      continue;
    }

    if (!scriptsById.has(script.id)) {
      scripts.push(
        isPortableScript(script) ? serializeStoredScript(script, data.roleCatalog) : script.id,
      );
      scriptsById.set(script.id, script);
    }
  }

  return {
    ...data,
    friends,
    games: games.map((game) => exportGame(game, scriptsById)),
    roleCatalog,
    savedNotes,
    scripts,
  };
}

function exportGame(game: Game, scriptsById: Map<string, StoredScript>): ExportedGame {
  const { lorics, script, ...gameWithoutScript } = game;
  const gameWithoutScriptReference = {
    ...gameWithoutScript,
    conversations: game.conversations.map(
      ({ initiatorId: _initiatorId, kind, ...conversation }) => ({
        ...conversation,
        ...(kind && kind !== 'interaction' ? { kind } : {}),
      }),
    ),
    players: game.players.map(({ name: _name, ...player }) => player),
    ...(lorics !== undefined ? { lorics: getRoleIds(lorics) } : {}),
  };

  if (!script) {
    return gameWithoutScriptReference;
  }

  if (isSushiBuffetScript(script)) {
    return {
      ...gameWithoutScriptReference,
      scriptId: script.id,
      scriptRoleIds: script.roles.map((role) => role.id),
    };
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
    ...gameWithoutScriptReference,
    scriptId: script.id,
    ...(scriptRoleIds ? { scriptRoleIds } : {}),
    ...(scriptRoleOverrides?.length ? { scriptRoleOverrides } : {}),
  };
}

function restoreExportedData(data: ExportedGameData): GameData {
  const roleCatalog = data.roleCatalog.map(normalizeRoleImageUrls);
  const restoredScripts = data.scripts.map((script) =>
    typeof script === 'string'
      ? createScriptPlaceholder(script)
      : restoreStoredScript(script, roleCatalog),
  );
  const legacySushiScript = restoredScripts.find(isSushiBuffetScript);
  const storedScripts = restoredScripts.filter((script) => !isSushiBuffetScript(script));
  const scriptsById = new Map(
    storedScripts.filter((script) => script.roles.length > 0).map((script) => [script.id, script]),
  );
  const rolesById = new Map<string, Role>();
  const friendNamesById = new Map(data.friends.map((friend) => [friend.id, friend.name]));

  for (const role of roleCatalog) {
    rolesById.set(role.id, role);
  }
  for (const script of restoredScripts) {
    for (const role of script.roles) {
      rolesById.set(role.id, role);
    }
  }

  const games = data.games.map((game) => {
    const { lorics, scriptId, scriptRoleIds, scriptRoleOverrides, ...gameWithoutScript } = game;
    const gameWithoutScriptReference = {
      ...gameWithoutScript,
      conversations: gameWithoutScript.conversations.map((conversation) => ({
        ...conversation,
        kind: conversation.kind ?? 'interaction',
        initiatorId: conversation.initiatorId ?? conversation.participantIds[0] ?? '',
      })),
      players: gameWithoutScript.players.map((player) => ({
        ...player,
        name:
          player.id === APP_USER_ID
            ? data.appUserName
            : (friendNamesById.get(player.id) ?? player.name ?? 'Unknown Player'),
      })),
      ...(lorics !== undefined ? { lorics: getRoleIds(lorics) } : {}),
    };
    const script =
      scriptId === SUSHI_BUFFET_SCRIPT_ID
        ? legacySushiScript
        : scriptId
          ? scriptsById.get(scriptId)
          : undefined;

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
  });

  return {
    ...data,
    roleCatalog,
    scripts: storedScripts,
    games: restoreSushiBuffetScriptRoles(games, roleCatalog),
  };
}

function restoreLegacyData(data: GameData): GameData {
  const normalizedData = normalizeRoleImagesInState(data);
  const roleCatalog = normalizedData.roleCatalog.map(normalizeRoleImageUrls);
  const scripts = normalizedData.scripts
    .filter((script) => !isSushiBuffetScript(script))
    .map((script) => restoreStoredScript(script, roleCatalog));
  const games = restoreSushiBuffetScriptRoles(
    restoreGameScripts(normalizedData.games, roleCatalog),
    roleCatalog,
  );

  return { ...normalizedData, games, roleCatalog, scripts };
}

function isImportedScript(script: StoredScript) {
  return (
    script.roles.length > 0 &&
    script.remoteId === undefined &&
    script.author !== officialScriptAuthor
  );
}

function isPortableScript(script: StoredScript) {
  return isImportedScript(script);
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

function sameRoleIds(first: Role[], second: Role[]) {
  return (
    first.length === second.length && first.every((role, index) => role.id === second[index]?.id)
  );
}

function roundToTwoDecimals(value: number) {
  return Number(value.toFixed(2));
}

function isGameData(value: unknown): value is GameData {
  return (
    isRecord(value) &&
    typeof value.appUserName === 'string' &&
    Array.isArray(value.friends) &&
    value.friends.every(isFriend) &&
    Array.isArray(value.games) &&
    value.games.every(isGame) &&
    Array.isArray(value.roleCatalog) &&
    value.roleCatalog.every(isRole) &&
    Array.isArray(value.savedNotes) &&
    value.savedNotes.every(isSavedNote) &&
    Array.isArray(value.scripts) &&
    value.scripts.every(isRuntimeStoredScript)
  );
}

function isExportedGameData(value: unknown): value is ExportedGameData {
  return (
    isRecord(value) &&
    typeof value.appUserName === 'string' &&
    Array.isArray(value.friends) &&
    value.friends.every(isFriend) &&
    Array.isArray(value.games) &&
    value.games.every(isExportedGame) &&
    Array.isArray(value.roleCatalog) &&
    value.roleCatalog.every(isRole) &&
    Array.isArray(value.savedNotes) &&
    value.savedNotes.every(isSavedNote) &&
    Array.isArray(value.scripts) &&
    value.scripts.every((script) => typeof script === 'string' || isSerializedStoredScript(script))
  );
}

function isFriend(value: unknown): value is GameData['friends'][number] {
  return isRecord(value) && isString(value.id) && isString(value.name) && isString(value.createdAt);
}

function isRole(value: unknown): value is Role {
  return isRecord(value) && isString(value.id) && isString(value.name);
}

function isRuntimeStoredScript(value: unknown): value is StoredScript {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.version) &&
    isString(value.updatedAt) &&
    Array.isArray(value.roles) &&
    value.roles.every(isRole)
  );
}

function isSerializedStoredScript(value: unknown): value is SerializedStoredScript {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.version) &&
    isString(value.updatedAt) &&
    Array.isArray(value.roles) &&
    value.roles.every((role) => isRole(role) || isString(role))
  );
}

function isPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isFiniteNumber(value.seat) &&
    isOptionalBoolean(value.isStoryteller) &&
    (!('position' in value) || value.position === undefined || isPosition(value.position))
  );
}

function isPosition(value: unknown) {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isConversation(value: unknown) {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isFiniteNumber(value.day) &&
    isStringArray(value.participantIds) &&
    isString(value.initiatorId) &&
    (!('voterIds' in value) || value.voterIds === undefined || isStringArray(value.voterIds))
  );
}

function isGame(value: unknown): value is Game {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isFiniteNumber(value.activeDay) &&
    isOptionalGameResult(value.result) &&
    isOptionalStringArray(value.sushiRoleIds) &&
    Array.isArray(value.players) &&
    value.players.every(isPlayer) &&
    Array.isArray(value.conversations) &&
    value.conversations.every(isConversation)
  );
}

function isExportedGame(value: unknown): value is ExportedGame {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isFiniteNumber(value.activeDay) &&
    isOptionalGameResult(value.result) &&
    isOptionalStringArray(value.sushiRoleIds) &&
    Array.isArray(value.players) &&
    value.players.every(
      (player) =>
        isRecord(player) &&
        isString(player.id) &&
        isOptionalBoolean(player.isStoryteller) &&
        (!('name' in player) || player.name === undefined),
    ) &&
    Array.isArray(value.conversations) &&
    value.conversations.every(
      (conversation) =>
        isRecord(conversation) &&
        isString(conversation.id) &&
        isFiniteNumber(conversation.day) &&
        isStringArray(conversation.participantIds),
    )
  );
}

function isSavedNote(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.playerName) &&
    isStringArray(value.roleIds) &&
    isString(value.text) &&
    isString(value.gameId) &&
    isString(value.scriptName) &&
    isFiniteNumber(value.day) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value);
}

function isOptionalGameResult(value: unknown) {
  return value === undefined || isGameResult(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
