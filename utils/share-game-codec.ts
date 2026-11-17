import { deflateSync, inflateSync, strFromU8, strToU8 } from 'fflate';

import type { CharacterTypeCounts } from '@/types/game';
import { getAutomaticCharacterTypeCounts } from '@/utils/character-type-counts';
import type { SerializedStoredScript } from '@/utils/script-storage';

// Kept free of the app's heavier modules so the link-preview API routes can bundle it alone.

export const SHARE_GAME_PARAM = 'g';
/** Opens the game in the app. */
export const SHARE_GAME_PATH = '/join';
/** The link people send: an API route that answers with preview tags, then opens SHARE_GAME_PATH. */
export const SHARE_GAME_LINK_PATH = '/share';
export const SHARE_GAME_IMAGE_PATH = '/og';
export const SHARE_PREVIEW_WIDTH = 1200;
export const SHARE_PREVIEW_HEIGHT = 630;

/** v1 links were deflated JSON; v2 links pack the game into bytes (see `packSharedGame`). */
export const SHARE_GAME_VERSION = 2;
const PACKED_VERSION_BYTE = 2;
const DEFLATED_FLAG = 0x80;
/** Name, seat, x, y, and 1 for a Storyteller. Positions are rounded map pixels. */
export type SharedPlayer = [string, number, number, number, 1?];

export type SharedScript = Omit<SerializedStoredScript, 'updatedAt'>;

export type SharedScriptReference = { id: string; remoteId?: number };

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
  /** Townsfolk, Outsiders, Minions and Demons when the game sets them by hand. */
  k?: [number, number, number, number];
};

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

export function getSharedScriptName(sharedGame: SharedGame) {
  if (sharedGame.s) return sharedGame.s.name;
  if (sharedGame.r) return getNameFromScriptId(sharedGame.r.id);
  if (sharedGame.su || sharedGame.sr) return 'Sushi Buffet';
  return undefined;
}

/** `trouble-brewing` → Trouble Brewing, `1234-uncertain-death` → Uncertain Death. */
export function getNameFromScriptId(id: string) {
  return id
    .replace(/^\d+-/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => `${word[0].toLocaleUpperCase()}${word.slice(1)}`)
    .join(' ');
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
    (game.l === undefined || isStringArray(game.l)) &&
    (game.k === undefined ||
      (Array.isArray(game.k) && game.k.length === 4 && game.k.every(isPositiveOrZero)))
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

function isPositiveOrZero(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
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
const FLAG_COUNTS = 128;
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
      (sharedGame.k ? FLAG_COUNTS : 0) |
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
  if (sharedGame.k) for (const count of sharedGame.k) writer.varint(count);

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
  const scriptKind = (flags >> SCRIPT_KIND_SHIFT) & 3;
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
  const counts =
    flags & FLAG_COUNTS
      ? ([reader.varint(), reader.varint(), reader.varint(), reader.varint()] as SharedGame['k'])
      : undefined;

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
    ...(counts ? { k: counts } : {}),
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

/** The game's starting characters: set by hand, or the standard setup for the player count. */
export function getSharedCharacterCounts(sharedGame: SharedGame): CharacterTypeCounts {
  if (sharedGame.k) {
    const [townsfolk, outsiders, minions, demons] = sharedGame.k;
    return { townsfolk, outsiders, minions, demons };
  }

  return getAutomaticCharacterTypeCounts(sharedGame.p.filter((player) => !player[4]).length);
}
