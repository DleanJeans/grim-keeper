import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';

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
import type { SerializedRole, SerializedStoredScript } from '@/utils/script-storage';

/** Where shared links open when the app is not running on the web (the Android app). */
export const SHARE_GAME_WEB_URL = 'https://grim-keeper.expo.app';
export const SHARE_GAME_PATH = '/share';
export const SHARE_GAME_PARAM = 'g';

const SHARE_GAME_VERSION = 1;
const DEFAULT_APP_USER_NAME = 'you';

/** Name, seat, x, y, and 1 for a Storyteller. Positions are rounded map pixels. */
type SharedPlayer = [string, number, number, number, 1?];

type SharedScript = Omit<SerializedStoredScript, 'updatedAt'>;

/**
 * Game setup only: who sits where on the map and the script. No claims, confirms, deaths,
 * notes or Character info, so friends start from a clean game.
 */
export type SharedGame = {
  v: typeof SHARE_GAME_VERSION;
  /** createdAt, so opening the same link twice finds the game instead of adding another. */
  c: string;
  n?: 0 | 1;
  w: number;
  h: number;
  t?: number;
  p: SharedPlayer[];
  s?: SharedScript;
  /** Sushi Buffet: the script's character ids and the enabled ones. */
  sr?: string[];
  su?: string[];
  l?: string[];
};

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
  const isSushi = (exportedGame.scriptId ?? script?.id) === SUSHI_BUFFET_SCRIPT_ID;

  return {
    v: SHARE_GAME_VERSION,
    c: game.createdAt,
    ...(game.startingNight !== undefined ? { n: game.startingNight } : {}),
    w: Math.round(mapWidth),
    h: Math.round(mapHeight),
    ...(game.tokenSize !== undefined ? { t: game.tokenSize } : {}),
    p: [...setupGame.players]
      .sort(
        (first, second) =>
          Number(!!first.isStoryteller) - Number(!!second.isStoryteller) ||
          first.seat - second.seat,
      )
      .map((player): SharedPlayer => {
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
    ...(isSushi
      ? {
          sr: exportedGame.scriptRoleIds ?? [],
          ...(game.sushiRoleIds ? { su: game.sushiRoleIds } : {}),
        }
      : script
        ? { s: toSharedScript(script) }
        : {}),
    ...(game.lorics?.length ? { l: game.lorics } : {}),
  };
}

export function createShareGameUrl(sharedGame: SharedGame, baseUrl = getShareBaseUrl()) {
  return `${baseUrl}${SHARE_GAME_PATH}?${SHARE_GAME_PARAM}=${encodeSharedGame(sharedGame)}`;
}

export function encodeSharedGame(sharedGame: SharedGame) {
  return toBase64Url(deflateSync(strToU8(JSON.stringify(sharedGame)), { level: 9 }));
}

export function decodeSharedGame(value: string): SharedGame {
  let parsed: unknown;

  try {
    parsed = JSON.parse(strFromU8(inflateSync(fromBase64Url(value))));
  } catch {
    throw new Error('This share link is broken or was cut off. Ask for the link again.');
  }

  if (!isSharedGame(parsed)) {
    throw new Error('This share link is not a Grim Keeper game.');
  }

  return parsed;
}

/** Index of the seated player whose name is the app user's, unless it is missing or not unique. */
export function findSharedPlayerIndex(sharedGame: SharedGame, appUserName: string) {
  const nameKey = getNameKey(appUserName);
  if (!nameKey || nameKey === DEFAULT_APP_USER_NAME) {
    return undefined;
  }

  const matches = sharedGame.p.flatMap((player, index) =>
    !player[4] && getNameKey(player[0]) === nameKey ? [index] : [],
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
  const script = sharedGame.s ? { ...sharedGame.s, updatedAt: now } : undefined;
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
    ...(script ? { scriptId: script.id, script } : {}),
    ...(sharedGame.sr
      ? {
          scriptId: SUSHI_BUFFET_SCRIPT_ID,
          scriptRoleIds: sharedGame.sr,
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

function getNameKey(name: string) {
  return normalizePlayerName(name).toLocaleLowerCase();
}

function isSharedGame(value: unknown): value is SharedGame {
  if (typeof value !== 'object' || value === null) return false;
  const game = value as Record<string, unknown>;

  return (
    game.v === SHARE_GAME_VERSION &&
    typeof game.c === 'string' &&
    isPositiveNumber(game.w) &&
    isPositiveNumber(game.h) &&
    (game.t === undefined || isPositiveNumber(game.t)) &&
    (game.n === undefined || game.n === 0 || game.n === 1) &&
    Array.isArray(game.p) &&
    game.p.length > 0 &&
    game.p.every(isSharedPlayer) &&
    (game.sr === undefined || isStringArray(game.sr)) &&
    (game.su === undefined || isStringArray(game.su)) &&
    (game.l === undefined || isStringArray(game.l))
  );
}

function isSharedPlayer(value: unknown) {
  return (
    Array.isArray(value) &&
    typeof value[0] === 'string' &&
    value.slice(1, 4).every((number) => typeof number === 'number' && Number.isFinite(number)) &&
    (value[4] === undefined || value[4] === 1)
  );
}

function isPositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function toBase64Url(bytes: Uint8Array) {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    output += BASE64_ALPHABET[a >> 2];
    output += BASE64_ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) output += BASE64_ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) output += BASE64_ALPHABET[c & 63];
  }

  return output;
}

function fromBase64Url(value: string) {
  const clean = value.trim().replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let byteIndex = 0;
  let buffer = 0;
  let bits = 0;

  for (const character of clean) {
    const digit = BASE64_ALPHABET.indexOf(character);
    if (digit < 0) {
      throw new Error('Invalid base64url character.');
    }
    buffer = ((buffer << 6) | digit) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[byteIndex] = (buffer >> bits) & 255;
      byteIndex += 1;
    }
  }

  return bytes.subarray(0, byteIndex);
}
