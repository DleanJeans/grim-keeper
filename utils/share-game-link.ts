import type { Game, Player, PlayerPosition, Role, StoredScript } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { createGameTransfer, type GameTransfer, parseGameTransfer } from '@/utils/game-transfer';
import {
  defaultMapHeight,
  defaultMapWidth,
  getPlayerMapPosition,
  resolveMapOverlaps,
} from '@/utils/layout-utils';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';
import { OFFICIAL_CAROUSEL_SCRIPT_ID } from '@/utils/script-service';
import {
  restoreScriptRoles,
  type SerializedRole,
  type SerializedStoredScript,
} from '@/utils/script-storage';
import {
  encodeSharedGame,
  getNameFromScriptId,
  getSharedCharacterCounts,
  SHARE_GAME_LINK_PATH,
  SHARE_GAME_PARAM,
  SHARE_GAME_VERSION,
  type SharedGame,
  type SharedPlayer,
  type SharedScript,
  type SharedScriptReference,
} from '@/utils/share-game-codec';

/** Where shared links open when the app is not running on the web (the Android app). */
export const SHARE_GAME_WEB_URL = 'https://grim-keeper.expo.app';

export {
  decodeSharedGame,
  encodeSharedGame,
  getSharedCharacterCounts,
  getSharedScriptName,
} from '@/utils/share-game-codec';
export type { SharedGame };

const DEFAULT_APP_USER_NAME = 'you';

export function createSharedGame(
  game: Game,
  scripts: StoredScript[],
  roleCatalog: Role[],
  appUserName: string,
): SharedGame {
  const mapWidth = game.mapWidth ?? defaultMapWidth;
  const mapHeight = game.mapHeight ?? defaultMapHeight;
  const setupGame: Game = {
    ...game,
    conversations: [],
    players: game.players.map((player) => ({
      id: player.id,
      isStoryteller: player.isStoryteller,
      name: player.id === APP_USER_ID ? normalizePlayerName(appUserName) : player.name,
      position: player.position,
      seat: player.seat,
    })),
  };
  const exported = JSON.parse(createGameTransfer(setupGame, scripts, roleCatalog)) as {
    data: { game: Game & { script?: SerializedStoredScript }; script?: SerializedStoredScript };
  };
  const exportedGame = exported.data.game;
  const script = exportedGame.script ?? exported.data.script;
  const scriptId = exportedGame.scriptId ?? script?.id;
  const isSushi = scriptId === SUSHI_BUFFET_SCRIPT_ID;
  const reference = !isSushi ? getScriptReference(game, scriptId, scripts) : undefined;

  const sortedPlayers = [...setupGame.players].sort(
    (first, second) =>
      Number(!!first.isStoryteller) - Number(!!second.isStoryteller) || first.seat - second.seat,
  );
  const sharerIndex = sortedPlayers.findIndex(
    (player) => player.id === APP_USER_ID && !player.isStoryteller,
  );

  return {
    v: SHARE_GAME_VERSION,
    c: game.createdAt,
    ...(game.startingNight !== undefined ? { n: game.startingNight } : {}),
    w: Math.round(mapWidth),
    h: Math.round(mapHeight),
    ...(game.tokenSize !== undefined ? { t: game.tokenSize } : {}),
    p: sortedPlayers.map((player): SharedPlayer => {
      const position = getPlayerMapPosition(
        player,
        setupGame.players,
        mapWidth,
        mapHeight,
        game.tokenSize,
      );
      const x = Math.round(position.x);
      const y = Math.round(position.y);
      return player.isStoryteller
        ? [player.name, player.seat, x, y, 1]
        : [player.name, player.seat, x, y];
    }),
    ...(sharerIndex >= 0 ? { o: sharerIndex } : {}),
    ...(isSushi
      ? { su: game.sushiRoleIds ?? exportedGame.scriptRoleIds ?? [] }
      : reference
        ? { r: reference }
        : script
          ? { s: toSharedScript(script) }
          : {}),
    ...(game.lorics?.length ? { l: game.lorics } : {}),
    ...(game.characterTypeCounts
      ? {
          k: [
            game.characterTypeCounts.townsfolk,
            game.characterTypeCounts.outsiders,
            game.characterTypeCounts.minions,
            game.characterTypeCounts.demons,
          ] as SharedGame['k'],
        }
      : {}),
  };
}

export function createShareGameUrl(sharedGame: SharedGame, baseUrl = getShareBaseUrl()) {
  return `${baseUrl}${SHARE_GAME_LINK_PATH}?${SHARE_GAME_PARAM}=${encodeSharedGame(sharedGame)}`;
}

/** Index of the seated player whose name is the app user's, unless it is missing or not unique. */
export function findSharedPlayerIndex(sharedGame: SharedGame, appUserName: string) {
  const nameKey = getNameKey(appUserName);
  if (!nameKey || nameKey === DEFAULT_APP_USER_NAME) {
    return undefined;
  }

  const matches = sharedGame.p.flatMap((player, index) =>
    !player[4] && index !== sharedGame.o && getNameKey(player[0]) === nameKey ? [index] : [],
  );

  return matches.length === 1 ? matches[0] : undefined;
}

export function isDefaultAppUserName(name: string) {
  const nameKey = getNameKey(name);
  return !nameKey || nameKey === DEFAULT_APP_USER_NAME;
}

/** A game on this device from the same link: same start time and the same number of players. */
export function findExistingSharedGame(sharedGame: SharedGame, games: Game[]) {
  return games.find(
    (game) => game.createdAt === sharedGame.c && game.players.length === sharedGame.p.length,
  );
}

/**
 * Builds a game transfer from a shared game with the player at `playerIndex` as the app user,
 * and the map turned in 90° steps until that player sits at the bottom.
 */
export function createSharedGameTransfer(
  sharedGame: SharedGame,
  playerIndex: number,
  appUserName: string,
  scripts: StoredScript[] = [],
): GameTransfer {
  const now = new Date().toISOString();
  const players = sharedGame.p.map<Player>(([name, seat, x, y, storyteller], index) => ({
    id: index === playerIndex ? APP_USER_ID : `shared-player-${index}`,
    ...(storyteller ? { isStoryteller: true } : {}),
    name: index === playerIndex ? normalizePlayerName(appUserName) : name,
    position: { x, y },
    seat,
  }));
  const me = players[playerIndex];
  const quarterTurns = me
    ? getQuarterTurnsToBottom(me.position as PlayerPosition, sharedGame.w, sharedGame.h)
    : 0;
  const turnedPlayers = turnPlayersToBottom(
    players,
    sharedGame.w,
    sharedGame.h,
    quarterTurns,
    sharedGame.t,
  );
  const script = sharedGame.s
    ? { ...sharedGame.s, updatedAt: now }
    : sharedGame.r
      ? resolveScriptReference(sharedGame.r, scripts, now)
      : undefined;
  const sushiRoleIds = sharedGame.sr ?? sharedGame.su;
  const game = {
    id: 'shared-game',
    createdAt: sharedGame.c,
    updatedAt: now,
    activeDay: 1,
    activePhase: 'night',
    ...(sharedGame.n !== undefined ? { startingNight: sharedGame.n } : {}),
    mapWidth: sharedGame.w,
    mapHeight: sharedGame.h,
    ...(sharedGame.t !== undefined ? { tokenSize: sharedGame.t } : {}),
    players: turnedPlayers,
    conversations: [],
    ...(sharedGame.l ? { lorics: sharedGame.l } : {}),
    ...(sharedGame.k ? { characterTypeCounts: getSharedCharacterCounts(sharedGame) } : {}),
    ...(script ? { scriptId: script.id, script } : {}),
    ...(sushiRoleIds
      ? {
          scriptId: SUSHI_BUFFET_SCRIPT_ID,
          scriptRoleIds: sushiRoleIds,
          ...(sharedGame.su ? { sushiRoleIds: sharedGame.su } : {}),
        }
      : {}),
  };

  return parseGameTransfer(
    JSON.stringify({
      data: { game, ...(script ? { script } : {}) },
      exportedAt: now,
      format: 'grim-keeper-game',
      version: 3,
    }),
  );
}

/** Quarter turns clockwise that bring a spot closest to the bottom edge of the map. */
export function getQuarterTurnsToBottom(position: PlayerPosition, mapWidth = 1, mapHeight = 1) {
  let best = 0;
  let bestY = -Infinity;
  let point = { u: position.x / mapWidth, v: position.y / mapHeight };

  for (let turns = 0; turns < 4; turns += 1) {
    if (point.v > bestY + 1e-9) {
      best = turns;
      bestY = point.v;
    }
    point = turnClockwise(point);
  }

  return best;
}

/**
 * Turns every token a quarter turn clockwise `quarterTurns` times around the map, keeping the
 * map's size: each side of the map moves onto the next side, then overlaps are pushed apart.
 */
export function turnPlayersToBottom(
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  quarterTurns: number,
  tokenSize?: number,
): Player[] {
  const turns = ((quarterTurns % 4) + 4) % 4;
  if (turns === 0) {
    return players;
  }

  const turned = players.map((player) => {
    const position = getPlayerMapPosition(player, players, mapWidth, mapHeight, tokenSize);
    let point = { u: position.x / mapWidth, v: position.y / mapHeight };
    for (let turn = 0; turn < turns; turn += 1) {
      point = turnClockwise(point);
    }
    return { ...player, position: { x: point.u * mapWidth, y: point.v * mapHeight } };
  });
  const placed = turned.map((player) => ({
    ...player,
    position: getPlayerMapPosition(player, turned, mapWidth, mapHeight, tokenSize),
  }));
  const pushedApart = resolveMapOverlaps(placed, mapWidth, mapHeight, tokenSize ?? 90);

  return placed.map((player) => ({
    ...player,
    position: roundPosition(pushedApart[player.id] ?? (player.position as PlayerPosition)),
  }));
}

export function getShareBaseUrl() {
  if (process.env.EXPO_OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return SHARE_GAME_WEB_URL;
}

function turnClockwise({ u, v }: { u: number; v: number }) {
  // On screen (y grows downward) clockwise sends the bottom side to the left side.
  return { u: 1 - v, v: u };
}

function roundPosition(position: PlayerPosition): PlayerPosition {
  return { x: Math.round(position.x), y: Math.round(position.y) };
}

function toSharedScript(script: SerializedStoredScript): SharedScript {
  const { updatedAt: _updatedAt, oneTime: _oneTime, baseScriptId: _baseScriptId, ...rest } = script;

  return { ...rest, roles: script.roles.map(stripPersonalRoleData) };
}

/** Custom characters travel whole, minus the sharer's own notes about them. */
function stripPersonalRoleData(role: SerializedRole): SerializedRole {
  if (typeof role === 'string') {
    return role;
  }

  const { notes: _notes, imageSource: _imageSource, redTint: _redTint, ...rest } = role;
  return rest;
}

/**
 * Sends a downloadable script by id when the game plays it unchanged: same characters as the
 * script saved on this device, which came from BotC Scripts (or is the built-in Carousel).
 */
function getScriptReference(
  game: Game,
  scriptId: string | undefined,
  scripts: StoredScript[],
): SharedScriptReference | undefined {
  const stored = scripts.find((candidate) => candidate.id === scriptId);
  if (
    !stored ||
    stored.roles.length === 0 ||
    (stored.remoteId === undefined && stored.id !== OFFICIAL_CAROUSEL_SCRIPT_ID)
  ) {
    return undefined;
  }

  const gameRoleIds = (game.script?.roles ?? stored.roles).map((role) => role.id).sort();
  const storedRoleIds = stored.roles.map((role) => role.id).sort();
  if (gameRoleIds.join(',') !== storedRoleIds.join(',')) {
    return undefined;
  }

  return stored.remoteId !== undefined
    ? { id: stored.id, remoteId: stored.remoteId }
    : { id: stored.id };
}

/**
 * The friend's own copy of a referenced script, or an empty placeholder that the app fills in
 * by downloading it (see OfficialScriptsLoader), like a restored backup.
 */
/**
 * The characters of the shared script that this device can show: a script sent in full, or a
 * BotC Scripts / Carousel script the app already has. Sushi Buffet picks its characters per
 * game, so it shows none.
 */
export function getSharedScriptRoles(
  sharedGame: SharedGame,
  scripts: StoredScript[],
  roleCatalog: Role[],
): Role[] {
  if (sharedGame.sr || sharedGame.su) {
    return [];
  }

  if (sharedGame.s) {
    return restoreScriptRoles(sharedGame.s.roles, roleCatalog);
  }

  const reference = sharedGame.r;
  if (!reference) {
    return [];
  }

  return (
    scripts.find(
      (candidate) =>
        candidate.id === reference.id ||
        (reference.remoteId !== undefined && candidate.remoteId === reference.remoteId),
    )?.roles ?? []
  );
}

function resolveScriptReference(
  reference: SharedScriptReference,
  scripts: StoredScript[],
  now: string,
): SerializedStoredScript {
  const local = scripts.find(
    (candidate) =>
      candidate.roles.length > 0 &&
      (candidate.id === reference.id ||
        (reference.remoteId !== undefined && candidate.remoteId === reference.remoteId)),
  );
  if (local) {
    return JSON.parse(JSON.stringify(local)) as SerializedStoredScript;
  }

  return {
    id: reference.id,
    name: getNameFromScriptId(reference.id),
    ...(reference.remoteId !== undefined ? { remoteId: reference.remoteId } : {}),
    roles: [],
    updatedAt: now,
    version: '',
  };
}

function getNameKey(name: string) {
  return normalizePlayerName(name).toLocaleLowerCase();
}
