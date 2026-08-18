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
import {
  APP_USER_ID,
  addMissingFriendsForGames,
  createGameId,
  mapGamePlayerIdsToFriendIds,
} from '@/utils/object-id';
import { mergeRoleCatalogMetadata } from '@/utils/role-utils';
import { restoreRedundantRoleImageUrl, stripRedundantRoleImageUrl } from '@/utils/script-storage';

const gameTransferFormat = 'grim-keeper-game';
const gameTransferVersion = 1;

export type GameTransfer = {
  data: {
    game: Game;
    script?: StoredScript;
  };
  exportedAt: string;
  format: typeof gameTransferFormat;
  version: typeof gameTransferVersion;
};

type GameData = {
  appUserName: string;
  friends: Friend[];
  games: Game[];
  roleCatalog: Role[];
  savedNotes: SavedNote[];
  scripts: StoredScript[];
};

export function createGameTransfer(game: Game, scripts: StoredScript[]) {
  const scriptId = game.scriptId ?? game.script?.id;
  const script = scripts.find((candidate) => candidate.id === scriptId) ?? game.script;

  if (scriptId && !script) {
    throw new Error('The script used by this game is not available to export.');
  }

  const exportedGame = game.script
    ? {
        ...game,
        script: {
          ...game.script,
          roles: game.script.roles.map(stripRedundantRoleImageUrl),
        },
      }
    : script
      ? {
          ...game,
          script: {
            ...script,
            roles: script.roles.map(stripRedundantRoleImageUrl),
          },
        }
      : game;

  const transfer: GameTransfer = {
    data: {
      game: exportedGame,
      ...(script
        ? {
            script: {
              ...script,
              roles: script.roles.map(stripRedundantRoleImageUrl),
            },
          }
        : {}),
    },
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
    transfer.version !== gameTransferVersion ||
    !isString(transfer.exportedAt) ||
    !isRecord(transfer.data) ||
    !isGame(transfer.data.game) ||
    (transfer.data.script !== undefined && !isStoredScript(transfer.data.script))
  ) {
    throw new Error('The game transfer is missing required Grim Keeper data.');
  }

  const gameScriptId = transfer.data.game.scriptId ?? transfer.data.game.script?.id;

  if (gameScriptId && !transfer.data.script) {
    throw new Error('The game transfer is missing the script used by this game.');
  }

  const game = restoreGameImages(transfer.data.game);
  const script = transfer.data.script ? restoreScriptImages(transfer.data.script) : undefined;

  return {
    data: { game, ...(script ? { script } : {}) },
    exportedAt: transfer.exportedAt,
    format: gameTransferFormat,
    version: gameTransferVersion,
  };
}

export function mergeGameTransfer(data: GameData, transfer: GameTransfer): GameData {
  const importedGame = transfer.data.game;
  const importedScript = transfer.data.script;
  const existingScript = importedScript
    ? data.scripts.find(
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
    : importedScript
      ? {
          ...importedScript,
          roles: mergeRoleCatalogMetadata(importedScript.roles, data.roleCatalog),
        }
      : undefined;
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
    ...(importedGame.script
      ? {
          script: {
            ...importedGame.script,
            id: storedScript?.id ?? importedGame.script.id,
            roles: mergeRoleCatalogMetadata(importedGame.script.roles, data.roleCatalog),
          },
        }
      : storedScript
        ? { script: { ...storedScript, roles: [...storedScript.roles] } }
        : {}),
  } satisfies Game;
  const game = mapGamePlayerIdsToFriendIds(gameWithLocalAppUser, friends, data.appUserName);
  const scripts = storedScript
    ? existingScript
      ? data.scripts.map((script) => (script.id === existingScript.id ? storedScript : script))
      : [...data.scripts, storedScript]
    : data.scripts;

  return {
    ...data,
    friends,
    games: [game, ...data.games],
    scripts,
  };
}

function restoreGameImages(game: Game): Game {
  return game.script ? { ...game, script: restoreScriptImages(game.script) } : game;
}

function restoreScriptImages(script: StoredScript): StoredScript {
  return {
    ...script,
    roles: script.roles.map(restoreRedundantRoleImageUrl),
  };
}

function isGame(value: unknown): value is Game {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.createdAt) &&
    isString(value.updatedAt) &&
    isFiniteNumber(value.activeDay) &&
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
    (value.script === undefined || isStoredScript(value.script))
  );
}

function isStoredScript(value: unknown): value is StoredScript {
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
    value.roles.every(isRole)
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

function isOptionalPlayerDayNotes(value: unknown): value is PlayerDayNote[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(isPlayerDayNote));
}

function isPlayerDayNote(value: unknown): value is PlayerDayNote {
  return (
    isRecord(value) &&
    isFiniteNumber(value.day) &&
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

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  return value === undefined || isStringArray(value);
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
