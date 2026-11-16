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
import { OFFICIAL_CAROUSEL_SCRIPT_ID } from '@/utils/script-service';
import type { SerializedRole, SerializedStoredScript } from '@/utils/script-storage';

/** Where shared links open when the app is not running on the web (the Android app). */
export const SHARE_GAME_WEB_URL = 'https://grim-keeper.expo.app';
export const SHARE_GAME_PATH = '/share';
export const SHARE_GAME_PARAM = 'g';

/** v1 links were deflated JSON; v2 links pack the game into bytes (see `packSharedGame`). */
const SHARE_GAME_VERSION = 2;
const PACKED_VERSION_BYTE = 2;
const DEFLATED_FLAG = 0x80;
const DEFAULT_APP_USER_NAME = 'you';

/** Name, seat, x, y, and 1 for a Storyteller. Positions are rounded map pixels. */
type SharedPlayer = [string, number, number, number, 1?];

type SharedScript = Omit<SerializedStoredScript, 'updatedAt'>;

type SharedScriptReference = { id: string; remoteId?: number };

/**
 * Game setup only: who sits where on the map and the script. No claims, confirms, deaths,
 * notes or Character info, so friends start from a clean game.
 */
export type SharedGame = {
  v: 1 | typeof SHARE_GAME_VERSION;
  /** createdAt, so opening the same link twice finds the game instead of adding another. */
  c: string;
  n?: 0 | 1;
  w: number;
  h: number;
  t?: number;
  p: SharedPlayer[];
  s?: SharedScript;
  /**
   * A script the friend's app can download itself (a BotC Scripts upload or Carousel), sent
   * by id instead of its character list.
   */
  r?: SharedScriptReference;
  /** Sushi Buffet (v1 only): the script's character ids. */
  sr?: string[];
  /** Sushi Buffet: the enabled characters. */
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
  const scriptId = exportedGame.scriptId ?? script?.id;
  const isSushi = scriptId === SUSHI_BUFFET_SCRIPT_ID;
  const reference = !isSushi ? getScriptReference(game, scriptId, scripts) : undefined;

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
      ? { su: game.sushiRoleIds ?? exportedGame.scriptRoleIds ?? [] }
      : reference
        ? { r: reference }
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
  const body = packSharedGame(sharedGame);
  const deflated = deflateSync(body, { level: 9 });
  const bytes =
    deflated.length < body.length
      ? concatBytes([PACKED_VERSION_BYTE | DEFLATED_FLAG], deflated)
      : concatBytes([PACKED_VERSION_BYTE], body);

  return toBase64Url(bytes);
}

export function decodeSharedGame(value: string): SharedGame {
  let parsed: unknown;

  try {
    parsed = parseSharedGameBytes(fromBase64Url(value));
  } catch {
    throw new Error('This share link is broken or was cut off. Ask for the link again.');
  }

  if (!isSharedGame(parsed)) {
    throw new Error('This share link is not a Grim Keeper game.');
  }

  return parsed;
}

function parseSharedGameBytes(bytes: Uint8Array): unknown {
  if ((bytes[0] & ~DEFLATED_FLAG) === PACKED_VERSION_BYTE) {
    try {
      return unpackSharedGame(
        bytes[0] & DEFLATED_FLAG ? inflateSync(bytes.subarray(1)) : bytes.subarray(1),
      );
    } catch {
      // Not a packed link after all: fall through to the older deflated JSON links.
    }
  }

  return JSON.parse(strFromU8(inflateSync(bytes)));
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

export function getSharedScriptName(sharedGame: SharedGame) {
  if (sharedGame.s) return sharedGame.s.name;
  if (sharedGame.r) return getNameFromScriptId(sharedGame.r.id);
  if (sharedGame.su || sharedGame.sr) return 'Sushi Buffet';
  return undefined;
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

/** `trouble-brewing` → Trouble Brewing, `1234-uncertain-death` → Uncertain Death. */
function getNameFromScriptId(id: string) {
  return id
    .replace(/^\d+-/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => `${word[0].toLocaleUpperCase()}${word.slice(1)}`)
    .join(' ');
}

function getNameKey(name: string) {
  return normalizePlayerName(name).toLocaleLowerCase();
}

function isSharedGame(value: unknown): value is SharedGame {
  if (typeof value !== 'object' || value === null) return false;
  const game = value as Record<string, unknown>;

  return (
    (game.v === 1 || game.v === SHARE_GAME_VERSION) &&
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
    (game.r === undefined || isScriptReference(game.r)) &&
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

function isScriptReference(value: unknown) {
  if (typeof value !== 'object' || value === null) return false;
  const reference = value as Record<string, unknown>;
  return (
    typeof reference.id === 'string' &&
    (reference.remoteId === undefined || isPositiveNumber(reference.remoteId))
  );
}

function isPositiveNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

// Packed (v2) layout, all numbers as unsigned varints unless noted:
// flags byte, createdAt (epoch ms, or a string when flag set), map width, map height,
// token size?, seated count, Storyteller count, x and y as one byte each (share of the map),
// player names, then the script (reference, full JSON or Sushi Buffet ids) and Lorics.
const FLAG_HAS_NIGHT = 1;
const FLAG_NIGHT_ZERO = 2;
const FLAG_TOKEN_SIZE = 4;
const FLAG_LORICS = 8;
const FLAG_CREATED_AT_TEXT = 16;
const SCRIPT_KIND_SHIFT = 5;
const SCRIPT_NONE = 0;
const SCRIPT_REFERENCE = 1;
const SCRIPT_FULL = 2;
const SCRIPT_SUSHI = 3;

function packSharedGame(sharedGame: SharedGame) {
  const writer = createByteWriter();
  const createdAtMs = Date.parse(sharedGame.c);
  const createdAtIsIso =
    Number.isFinite(createdAtMs) &&
    createdAtMs >= 0 &&
    new Date(createdAtMs).toISOString() === sharedGame.c;
  const sushiRoleIds = sharedGame.su ?? sharedGame.sr;
  const scriptKind = sharedGame.r
    ? SCRIPT_REFERENCE
    : sharedGame.s
      ? SCRIPT_FULL
      : sushiRoleIds
        ? SCRIPT_SUSHI
        : SCRIPT_NONE;
  const seated = sharedGame.p.filter((player) => !player[4]);
  const storytellers = sharedGame.p.filter((player) => player[4]);
  const players = [...seated, ...storytellers];

  writer.byte(
    (sharedGame.n !== undefined ? FLAG_HAS_NIGHT : 0) |
      (sharedGame.n === 0 ? FLAG_NIGHT_ZERO : 0) |
      (sharedGame.t !== undefined ? FLAG_TOKEN_SIZE : 0) |
      (sharedGame.l?.length ? FLAG_LORICS : 0) |
      (createdAtIsIso ? 0 : FLAG_CREATED_AT_TEXT) |
      (scriptKind << SCRIPT_KIND_SHIFT),
  );
  if (createdAtIsIso) writer.varint(createdAtMs);
  else writer.text(sharedGame.c);
  writer.varint(Math.round(sharedGame.w));
  writer.varint(Math.round(sharedGame.h));
  if (sharedGame.t !== undefined) writer.varint(Math.round(sharedGame.t));
  writer.varint(seated.length);
  writer.varint(storytellers.length);
  for (const [, , x, y] of players) {
    writer.byte(toMapByte(x, sharedGame.w));
    writer.byte(toMapByte(y, sharedGame.h));
  }
  for (const [name] of players) writer.text(name);

  if (sharedGame.r) {
    writer.text(sharedGame.r.id);
    writer.varint(sharedGame.r.remoteId ?? 0);
  } else if (sharedGame.s) {
    writer.text(JSON.stringify(sharedGame.s));
  } else if (sushiRoleIds) {
    writer.textList(sushiRoleIds);
  }
  if (sharedGame.l?.length) writer.textList(sharedGame.l);

  return writer.bytes();
}

function unpackSharedGame(bytes: Uint8Array): SharedGame {
  const reader = createByteReader(bytes);
  const flags = reader.byte();
  const createdAt =
    flags & FLAG_CREATED_AT_TEXT ? reader.text() : new Date(reader.varint()).toISOString();
  const w = reader.varint();
  const h = reader.varint();
  const t = flags & FLAG_TOKEN_SIZE ? reader.varint() : undefined;
  const seatedCount = reader.varint();
  const storytellerCount = reader.varint();
  const count = seatedCount + storytellerCount;
  const positions = Array.from({ length: count }, () => ({
    x: fromMapByte(reader.byte(), w),
    y: fromMapByte(reader.byte(), h),
  }));
  const p = positions.map(({ x, y }, index): SharedPlayer => {
    const name = reader.text();
    return index < seatedCount ? [name, index, x, y] : [name, -1, x, y, 1];
  });
  const scriptKind = flags >> SCRIPT_KIND_SHIFT;
  let script: Pick<SharedGame, 'r' | 's' | 'su'> = {};
  if (scriptKind === SCRIPT_REFERENCE) {
    const id = reader.text();
    const remoteId = reader.varint();
    script = { r: remoteId ? { id, remoteId } : { id } };
  } else if (scriptKind === SCRIPT_FULL) {
    script = { s: JSON.parse(reader.text()) as SharedScript };
  } else if (scriptKind === SCRIPT_SUSHI) {
    script = { su: reader.textList() };
  }
  const lorics = flags & FLAG_LORICS ? reader.textList() : undefined;

  return {
    v: SHARE_GAME_VERSION,
    c: createdAt,
    ...(flags & FLAG_HAS_NIGHT ? { n: flags & FLAG_NIGHT_ZERO ? 0 : 1 } : {}),
    w,
    h,
    ...(t !== undefined ? { t } : {}),
    p,
    ...script,
    ...(lorics ? { l: lorics } : {}),
  };
}

function toMapByte(value: number, size: number) {
  return Math.min(255, Math.max(0, Math.round((value / Math.max(1, size)) * 255)));
}

function fromMapByte(value: number, size: number) {
  return Math.round((value / 255) * size);
}

function createByteWriter() {
  const output: number[] = [];
  const writer = {
    byte(value: number) {
      output.push(value & 255);
    },
    varint(value: number) {
      let remaining = Math.max(0, Math.floor(value));
      while (remaining >= 128) {
        output.push((remaining % 128) | 128);
        remaining = Math.floor(remaining / 128);
      }
      output.push(remaining);
    },
    text(value: string) {
      const encoded = strToU8(value);
      writer.varint(encoded.length);
      for (const byte of encoded) output.push(byte);
    },
    textList(values: string[]) {
      writer.varint(values.length);
      for (const value of values) writer.text(value);
    },
    bytes: () => Uint8Array.from(output),
  };
  return writer;
}

function createByteReader(bytes: Uint8Array) {
  let offset = 0;
  const reader = {
    byte() {
      if (offset >= bytes.length) throw new Error('Unexpected end of share data.');
      const value = bytes[offset];
      offset += 1;
      return value;
    },
    varint() {
      let value = 0;
      let scale = 1;
      for (;;) {
        const byte = reader.byte();
        value += (byte & 127) * scale;
        if (byte < 128) return value;
        scale *= 128;
        if (scale > 2 ** 56) throw new Error('Share number too large.');
      }
    },
    text() {
      const length = reader.varint();
      if (offset + length > bytes.length) throw new Error('Unexpected end of share data.');
      const value = strFromU8(bytes.subarray(offset, offset + length));
      offset += length;
      return value;
    },
    textList() {
      return Array.from({ length: reader.varint() }, () => reader.text());
    },
  };
  return reader;
}

function concatBytes(head: number[], tail: Uint8Array) {
  const bytes = new Uint8Array(head.length + tail.length);
  bytes.set(head);
  bytes.set(tail, head.length);
  return bytes;
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
