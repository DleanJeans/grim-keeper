import type { DjData, DjSessionSong } from '@/types/dj';
import type {
  Conversation,
  Friend,
  Game,
  Player,
  PlayerDayNote,
  PlayerDayNoteEntry,
  Role,
  SavedNote,
  StoredScript,
} from '@/types/game';
import { normalizeSongUrl } from '@/utils/dj-utils';
import { isGameResult } from '@/utils/game-utils';
import {
  APP_USER_ID,
  addMissingFriendsForGames,
  createGameId,
  mapGamePlayerIdsToFriendIds,
} from '@/utils/object-id';
import { mergeRoleCatalogMetadata } from '@/utils/role-utils';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';
import { isSushiBuffetScript } from '@/utils/script-service';
import {
  restoreGameScripts,
  restoreStoredScript,
  restoreSushiBuffetScriptRoles,
  type SerializedGame,
  type SerializedStoredScript,
  serializeGameScripts,
  serializeStoredScript,
} from '@/utils/script-storage';

const gameTransferFormat = 'grim-keeper-game';
const gameTransferVersion = 3;
const supportedGameTransferVersions = [1, 2, gameTransferVersion];

export type GameTransfer = {
  data: {
    game: Game;
    script?: StoredScript;
  };
  dj?: {
    sessions: DjSessionSong[];
  };
  exportedAt: string;
  format: typeof gameTransferFormat;
  version: 1 | 2 | typeof gameTransferVersion;
};

type GameData = {
  appUserName: string;
  friends: Friend[];
  games: Game[];
  roleCatalog: Role[];
  savedNotes: SavedNote[];
  scripts: StoredScript[];
};

export function createGameTransfer(
  game: Game,
  scripts: StoredScript[],
  roleCatalog: Role[] = [],
  djData?: DjData,
) {
  const scriptId = game.scriptId ?? game.script?.id;
  const script = scripts.find((candidate) => candidate.id === scriptId) ?? game.script;
  const isBuiltInSushi = scriptId === SUSHI_BUFFET_SCRIPT_ID || isSushiBuffetScript(script);

  if (scriptId && !script && !isBuiltInSushi) {
    throw new Error('The script used by this game is not available to export.');
  }

  const exportedGame = game.script
    ? serializeGameScripts([game], roleCatalog)[0]
    : isBuiltInSushi && script
      ? {
          ...game,
          scriptId: game.scriptId ?? script.id,
          scriptRoleIds: script.roles.map((role) => role.id),
        }
      : script && !isBuiltInSushi
        ? {
            ...game,
            script: {
              ...script,
              roles: serializeStoredScript(script, roleCatalog).roles,
            },
          }
        : game;

  const sessionRows = djData?.sessions.filter((session) => session.gameId === game.id);
  const transfer = {
    data: {
      game: exportedGame,
      ...(script && !isBuiltInSushi ? { script: serializeStoredScript(script, roleCatalog) } : {}),
    },
    ...(sessionRows?.length ? { dj: { sessions: sessionRows } } : {}),
    exportedAt: new Date().toISOString(),
    format: gameTransferFormat,
    version: gameTransferVersion,
  };

  return JSON.stringify(transfer);
}

export function parseGameTransfer(value: string): GameTransfer {
  let transfer: unknown;

  try {
    transfer = JSON.parse(value);
  } catch {
    throw new Error('This is not a valid Grim Keeper game transfer.');
  }

  if (
    !isRecord(transfer) ||
    transfer.format !== gameTransferFormat ||
    !supportedGameTransferVersions.includes(transfer.version as number) ||
    !isString(transfer.exportedAt) ||
    !isRecord(transfer.data) ||
    !isGame(transfer.data.game) ||
    (transfer.data.script !== undefined && !isSerializedStoredScript(transfer.data.script)) ||
    (transfer.dj !== undefined && !isDjTransferData(transfer.dj))
  ) {
    throw new Error('The game transfer is missing required Grim Keeper data.');
  }

  const gameScriptId = transfer.data.game.scriptId ?? transfer.data.game.script?.id;

  if (gameScriptId && gameScriptId !== SUSHI_BUFFET_SCRIPT_ID && !transfer.data.script) {
    throw new Error('The game transfer is missing the script used by this game.');
  }

  const restoredGame = restoreSushiBuffetScriptRoles(
    [restoreGameImages(transfer.data.game)],
    [],
  )[0];
  const game = {
    ...restoredGame,
    activePhase: restoredGame.activePhase ?? 'day',
    startingNight: restoredGame.startingNight ?? 1,
  };
  const script = transfer.data.script ? restoreScriptImages(transfer.data.script) : undefined;

  return {
    data: { game, ...(script ? { script } : {}) },
    ...(transfer.dj ? { dj: transfer.dj } : {}),
    exportedAt: transfer.exportedAt,
    format: gameTransferFormat,
    version: transfer.version as GameTransfer['version'],
  };
}

export function mergeGameTransfer(data: GameData, transfer: GameTransfer): GameData {
  const restoredGame = restoreSushiBuffetScriptRoles([transfer.data.game], data.roleCatalog)[0];
  const importedGame = {
    ...restoredGame,
    activePhase: restoredGame.activePhase ?? 'day',
    startingNight: restoredGame.startingNight ?? 1,
  };
  const importedScript = transfer.data.script;
  const portableBuiltInScript = importedScript && isSushiBuffetScript(importedScript);
  const existingScripts = data.scripts.filter((script) => !isSushiBuffetScript(script));
  const existingScript =
    importedScript && !portableBuiltInScript
      ? existingScripts.find(
          (script) =>
            script.id === importedScript.id ||
            (importedScript.remoteId !== undefined && script.remoteId === importedScript.remoteId),
        )
      : undefined;
  const storedScript = existingScript
    ? existingScript.roles.length === 0 && importedScript?.roles.length
      ? {
          ...existingScript,
          ...importedScript,
          id: existingScript.id,
          roles: mergeRoleCatalogMetadata(importedScript.roles, data.roleCatalog),
        }
      : existingScript
    : importedScript && !portableBuiltInScript
      ? {
          ...importedScript,
          roles: mergeRoleCatalogMetadata(importedScript.roles, data.roleCatalog),
        }
      : undefined;
  const gameScript =
    importedGame.script ?? storedScript ?? (portableBuiltInScript ? importedScript : undefined);
  const friends = addMissingFriendsForGames(data.friends, [importedGame], data.appUserName);
  const gameWithLocalAppUser = {
    ...importedGame,
    id: createGameId(
      storedScript?.name ?? importedGame.script?.name,
      importedGame.createdAt,
      data.games.map((game) => game.id),
    ),
    scriptId: storedScript?.id ?? importedGame.scriptId ?? importedGame.script?.id,
    players: importedGame.players.map((player) =>
      player.id === APP_USER_ID ? { ...player, name: data.appUserName } : player,
    ),
    ...(gameScript
      ? {
          script: {
            ...gameScript,
            id: storedScript?.id ?? gameScript.id,
            roles: mergeRoleCatalogMetadata(gameScript.roles, data.roleCatalog),
          },
        }
      : {}),
  } satisfies Game;
  const game = mapGamePlayerIdsToFriendIds(gameWithLocalAppUser, friends, data.appUserName);
  const scripts = storedScript
    ? existingScript
      ? existingScripts.map((script) => (script.id === existingScript.id ? storedScript : script))
      : [...existingScripts, storedScript]
    : existingScripts;

  return {
    ...data,
    friends,
    games: [game, ...data.games],
    scripts,
  };
}

function restoreGameImages(game: SerializedGame): Game {
  return restoreGameScripts([game])[0];
}

function restoreScriptImages(script: SerializedStoredScript): StoredScript {
  return restoreStoredScript(script);
}

function isGame(value: unknown): value is SerializedGame {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isFiniteNumber(value.activeDay) &&
    isOptionalGamePhase(value.activePhase) &&
    isOptionalStartingNight(value.startingNight) &&
    isOptionalGameResult(value.result) &&
    isOptionalStringArray(value.sushiRoleIds) &&
    isOptionalFiniteNumber(value.mapWidth) &&
    isOptionalFiniteNumber(value.mapHeight) &&
    isOptionalFiniteNumber(value.tokenSize) &&
    isOptionalStringArray(value.lorics) &&
    isOptionalStringArray(value.scriptRoleIds) &&
    isOptionalStringArray(value.scriptRoleOverrides) &&
    Array.isArray(value.players) &&
    value.players.every(isPlayer) &&
    Array.isArray(value.conversations) &&
    value.conversations.every(isConversation) &&
    isOptionalPlayerDayNotes(value.playerDayNotes) &&
    (value.script === undefined || isSerializedStoredScript(value.script))
  );
}

function isSerializedStoredScript(value: unknown): value is SerializedStoredScript {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.version) &&
    isString(value.updatedAt) &&
    isOptionalFiniteNumber(value.remoteId) &&
    isOptionalString(value.scriptType) &&
    isOptionalString(value.author) &&
    Array.isArray(value.roles) &&
    value.roles.every((role) => isRole(role) || isString(role))
  );
}

function isRole(value: unknown): value is Role {
  return isRecord(value) && isString(value.id) && isString(value.name);
}

function isPlayer(value: unknown): value is Player {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isFiniteNumber(value.seat) &&
    isOptionalBoolean(value.isStoryteller) &&
    (value.position === undefined || isPosition(value.position)) &&
    (value.death === undefined || isRecord(value.death)) &&
    (value.revive === undefined || isRecord(value.revive)) &&
    (value.roleAssignments === undefined ||
      (Array.isArray(value.roleAssignments) && value.roleAssignments.every(isRoleAssignment)))
  );
}

function isRoleAssignment(value: unknown) {
  return (
    isRecord(value) &&
    isFiniteNumber(value.day) &&
    isOptionalGamePhase(value.phase) &&
    isString(value.kind) &&
    isStringArray(value.roleIds) &&
    isOptionalString(value.subjectPlayerId) &&
    isString(value.updatedAt)
  );
}

function isConversation(value: unknown): value is Conversation {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isFiniteNumber(value.day) &&
    isStringArray(value.participantIds) &&
    isString(value.initiatorId) &&
    isOptionalStringArray(value.voterIds) &&
    isOptionalString(value.bigWigPlayerId) &&
    isOptionalString(value.kind) &&
    isString(value.createdAt)
  );
}

function isDjTransferData(value: unknown): value is { sessions: DjSessionSong[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(
      (session) =>
        isRecord(session) &&
        isString(session.gameId) &&
        isString(session.songUrl) &&
        normalizeSongUrl(session.songUrl) !== undefined &&
        isFiniteNumber(session.playedCount) &&
        isFiniteNumber(session.approvalScore),
    )
  );
}

function isOptionalPlayerDayNotes(value: unknown): value is PlayerDayNote[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(isPlayerDayNote));
}

function isPlayerDayNote(value: unknown): value is PlayerDayNote {
  return (
    isRecord(value) &&
    isFiniteNumber(value.day) &&
    isOptionalGamePhase(value.phase) &&
    isString(value.playerId) &&
    isString(value.updatedAt) &&
    Array.isArray(value.notes) &&
    value.notes.every(isPlayerDayNoteEntry)
  );
}

function isPlayerDayNoteEntry(value: unknown): value is PlayerDayNoteEntry {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.text) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
}

function isPosition(value: unknown) {
  return isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y);
}

function isOptionalFiniteNumber(value: unknown): value is number | undefined {
  return value === undefined || isFiniteNumber(value);
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value);
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean';
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value);
}

function isOptionalGameResult(value: unknown) {
  return value === undefined || isGameResult(value);
}

function isOptionalStartingNight(value: unknown): value is 0 | 1 | undefined {
  return value === undefined || value === 0 || value === 1;
}

function isOptionalGamePhase(value: unknown): value is 'day' | 'night' | undefined {
  return value === undefined || value === 'day' || value === 'night';
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
