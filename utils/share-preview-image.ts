import { zlibSync } from 'fflate';

import {
  getSharedCharacterCounts,
  getSharedScriptName,
  type SharedGame,
} from '@/utils/share-game-codec';

// A tiny pure-JS PNG drawer for the link preview image (no canvas, fonts or wasm), so it can
// run in the hosting server. The map is drawn as discs with initials, next to the script name.

export const PREVIEW_WIDTH = 800;
export const PREVIEW_HEIGHT = 420;

const MARGIN = 24;
const DEFAULT_TOKEN_SIZE = 100;
const RATIO_SCALE = 3;
const FONT_WIDTH = 5;
const FONT_HEIGHT = 7;
// Copies of the app's map and token colors (theme/colors.ts reads stored settings, which the
// server has none of).
const colors = {
  gameBackground: '#0b1120',
  gameBorder: '#334155',
  gameSurface: '#111827',
  gameText: '#f8fafc',
  gameTextSoft: '#cbd5e1',
  randomAccent: '#e2b04a',
};
const tokenColors = {
  edge: '#3b2412',
  ink: '#4a2c14',
  parchmentCenter: '#f6ecd2',
  parchmentEdge: '#c9ad78',
  parchmentMiddle: '#e6d3a8',
  storytellerRibbon: '#7a5a12',
};

type Rgb = readonly [number, number, number];

// 5x7 glyphs, one string of seven 5-bit rows each.
const FONT: Record<string, string> = {
  A: '01110 10001 10001 11111 10001 10001 10001',
  B: '11110 10001 10001 11110 10001 10001 11110',
  C: '01110 10001 10000 10000 10000 10001 01110',
  D: '11110 10001 10001 10001 10001 10001 11110',
  E: '11111 10000 10000 11110 10000 10000 11111',
  F: '11111 10000 10000 11110 10000 10000 10000',
  G: '01110 10001 10000 10111 10001 10001 01111',
  H: '10001 10001 10001 11111 10001 10001 10001',
  I: '01110 00100 00100 00100 00100 00100 01110',
  J: '00111 00010 00010 00010 00010 10010 01100',
  K: '10001 10010 10100 11000 10100 10010 10001',
  L: '10000 10000 10000 10000 10000 10000 11111',
  M: '10001 11011 10101 10101 10001 10001 10001',
  N: '10001 11001 10101 10011 10001 10001 10001',
  O: '01110 10001 10001 10001 10001 10001 01110',
  P: '11110 10001 10001 11110 10000 10000 10000',
  Q: '01110 10001 10001 10001 10101 10010 01101',
  R: '11110 10001 10001 11110 10100 10010 10001',
  S: '01111 10000 10000 01110 00001 00001 11110',
  T: '11111 00100 00100 00100 00100 00100 00100',
  U: '10001 10001 10001 10001 10001 10001 01110',
  V: '10001 10001 10001 10001 10001 01010 00100',
  W: '10001 10001 10001 10101 10101 11011 10001',
  X: '10001 10001 01010 00100 01010 10001 10001',
  Y: '10001 10001 01010 00100 00100 00100 00100',
  Z: '11111 00001 00010 00100 01000 10000 11111',
  '0': '01110 10001 10011 10101 11001 10001 01110',
  '1': '00100 01100 00100 00100 00100 00100 01110',
  '2': '01110 10001 00001 00010 00100 01000 11111',
  '3': '11110 00001 00001 01110 00001 00001 11110',
  '4': '00010 00110 01010 10010 11111 00010 00010',
  '5': '11111 10000 11110 00001 00001 10001 01110',
  '6': '00110 01000 10000 11110 10001 10001 01110',
  '7': '11111 00001 00010 00100 01000 01000 01000',
  '8': '01110 10001 10001 01110 10001 10001 01110',
  '9': '01110 10001 10001 01111 00001 00010 01100',
  '-': '00000 00000 00000 11111 00000 00000 00000',
  "'": '00100 00100 01000 00000 00000 00000 00000',
  '.': '00000 00000 00000 00000 00000 01100 01100',
  '&': '01100 10010 10100 01000 10101 10010 01101',
};

const glyphCache = new Map<string, number[][]>();

export function createSharePreviewPng(sharedGame: SharedGame): Uint8Array {
  const canvas = createCanvas(PREVIEW_WIDTH, PREVIEW_HEIGHT, hexToRgb(colors.gameBackground));
  const mapScale = Math.min(
    (PREVIEW_HEIGHT - MARGIN * 2) / sharedGame.h,
    (PREVIEW_WIDTH * 0.5) / sharedGame.w,
  );
  const mapWidth = Math.round(sharedGame.w * mapScale);
  const mapHeight = Math.round(sharedGame.h * mapScale);
  const mapLeft = MARGIN;
  const mapTop = Math.round((PREVIEW_HEIGHT - mapHeight) / 2);

  fillRect(
    canvas,
    mapLeft - 3,
    mapTop - 3,
    mapWidth + 6,
    mapHeight + 6,
    hexToRgb(colors.gameBorder),
  );
  fillRect(canvas, mapLeft, mapTop, mapWidth, mapHeight, hexToRgb(colors.gameSurface));

  const tokenRadius = Math.max(12, ((sharedGame.t ?? DEFAULT_TOKEN_SIZE) * mapScale) / 2) * 0.94;
  for (const [name, , x, y, storyteller] of sharedGame.p) {
    drawToken(
      canvas,
      mapLeft + x * mapScale,
      mapTop + y * mapScale,
      tokenRadius,
      name,
      !!storyteller,
    );
  }

  drawInfo(canvas, sharedGame, mapLeft + mapWidth + 40);

  return encodePng(canvas);
}

type Canvas = { data: Uint8Array; height: number; width: number };

function createCanvas(width: number, height: number, color: Rgb): Canvas {
  const data = new Uint8Array(width * height * 3);
  for (let index = 0; index < data.length; index += 3) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
  }
  return { data, height, width };
}

function fillRect(
  canvas: Canvas,
  left: number,
  top: number,
  width: number,
  height: number,
  color: Rgb,
) {
  for (let y = Math.max(0, top); y < Math.min(canvas.height, top + height); y += 1) {
    for (let x = Math.max(0, left); x < Math.min(canvas.width, left + width); x += 1) {
      blend(canvas, x, y, color, 1);
    }
  }
}

function blend(canvas: Canvas, x: number, y: number, color: Rgb, alpha: number) {
  if (alpha <= 0 || x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
    return;
  }
  const index = (y * canvas.width + x) * 3;
  for (let channel = 0; channel < 3; channel += 1) {
    canvas.data[index + channel] = Math.round(
      canvas.data[index + channel] * (1 - alpha) + color[channel] * alpha,
    );
  }
}

function drawDisc(canvas: Canvas, cx: number, cy: number, radius: number, color: Rgb) {
  for (let y = Math.floor(cy - radius - 1); y <= Math.ceil(cy + radius + 1); y += 1) {
    for (let x = Math.floor(cx - radius - 1); x <= Math.ceil(cx + radius + 1); x += 1) {
      const distance = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      blend(canvas, x, y, color, Math.min(1, Math.max(0, radius - distance + 0.5)));
    }
  }
}

function drawToken(
  canvas: Canvas,
  cx: number,
  cy: number,
  radius: number,
  name: string,
  storyteller: boolean,
) {
  drawDisc(canvas, cx, cy, radius, hexToRgb(tokenColors.edge));
  drawDisc(
    canvas,
    cx,
    cy,
    radius - Math.max(2, radius * 0.07),
    hexToRgb(tokenColors.parchmentEdge),
  );
  drawDisc(
    canvas,
    cx,
    cy,
    radius - Math.max(3, radius * 0.12),
    hexToRgb(tokenColors.parchmentMiddle),
  );
  drawDisc(canvas, cx, cy, radius * 0.66, hexToRgb(tokenColors.parchmentCenter));

  if (storyteller) {
    drawStar(canvas, cx, cy, radius * 0.5, hexToRgb(tokenColors.storytellerRibbon));
    return;
  }

  const initial = getInitial(name);
  const glyphHeight = radius * 0.95;
  drawGlyph(canvas, initial, cx, cy, glyphHeight / FONT_HEIGHT, hexToRgb(tokenColors.ink), true);
}

/** Four-pointed star, the Storyteller's mark. */
function drawStar(canvas: Canvas, cx: number, cy: number, size: number, color: Rgb) {
  for (let y = Math.floor(cy - size); y <= Math.ceil(cy + size); y += 1) {
    for (let x = Math.floor(cx - size); x <= Math.ceil(cx + size); x += 1) {
      const dx = Math.abs(x + 0.5 - cx) / size;
      const dy = Math.abs(y + 0.5 - cy) / size;
      // Astroid: |x|^(2/3) + |y|^(2/3) <= 1, softened over one pixel.
      const value = dx ** (2 / 3) + dy ** (2 / 3);
      blend(canvas, x, y, color, Math.min(1, Math.max(0, (1 - value) * size * 0.35 + 0.5)));
    }
  }
}

function drawInfo(canvas: Canvas, sharedGame: SharedGame, left: number) {
  const maxWidth = canvas.width - left - MARGIN;
  const scriptName = (getSharedScriptName(sharedGame) ?? 'Grim Keeper game').toLocaleUpperCase();
  const seated = sharedGame.p.filter((player) => !player[4]).length;
  let scale = 7;
  let lines = wrapText(scriptName, maxWidth, scale);
  while (
    (lines.length > 3 || lines.some((line) => measureText(line, scale) > maxWidth)) &&
    scale > 4
  ) {
    scale -= 1;
    lines = wrapText(scriptName, maxWidth, scale);
  }

  const counts = getSharedCharacterCounts(sharedGame);
  const ratio: Array<[number, string, string]> = [
    [counts.townsfolk, 'TOWNSFOLK', '#60a5fa'],
    [counts.outsiders, counts.outsiders === 1 ? 'OUTSIDER' : 'OUTSIDERS', '#a5b4fc'],
    [counts.minions, counts.minions === 1 ? 'MINION' : 'MINIONS', '#fb923c'],
    [counts.demons, counts.demons === 1 ? 'DEMON' : 'DEMONS', '#f87171'],
  ];
  const titleLine = (FONT_HEIGHT + 2) * scale;
  const ratioLine = (FONT_HEIGHT + 1) * RATIO_SCALE;
  const total =
    FONT_HEIGHT * 3 +
    18 +
    lines.length * titleLine +
    12 +
    FONT_HEIGHT * 4 +
    16 +
    ratio.length * ratioLine;
  let y = Math.max(MARGIN, Math.round((canvas.height - total) / 2));

  drawText(canvas, 'GRIM KEEPER', left, y, 3, hexToRgb(colors.randomAccent));
  y += FONT_HEIGHT * 3 + 18;
  for (const line of lines) {
    drawText(canvas, line, left, y, scale, hexToRgb(colors.gameText));
    y += titleLine;
  }
  y += 12;
  drawText(
    canvas,
    `${seated} PLAYER${seated === 1 ? '' : 'S'}`,
    left,
    y,
    4,
    hexToRgb(colors.gameText),
  );
  y += FONT_HEIGHT * 4 + 16;
  for (const [count, label, color] of ratio) {
    drawDisc(
      canvas,
      left + RATIO_SCALE * 3,
      y + (FONT_HEIGHT * RATIO_SCALE) / 2,
      RATIO_SCALE * 2.2,
      hexToRgb(color),
    );
    drawText(
      canvas,
      `${count} ${label}`,
      left + RATIO_SCALE * 9,
      y,
      RATIO_SCALE,
      hexToRgb(colors.gameTextSoft),
    );
    y += ratioLine;
  }
}

function wrapText(text: string, maxWidth: number, scale: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && measureText(next, scale) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines;
}

function measureText(text: string, scale: number) {
  return Array.from(text).length * (FONT_WIDTH + 1) * scale;
}

function drawText(
  canvas: Canvas,
  text: string,
  left: number,
  top: number,
  scale: number,
  color: Rgb,
) {
  Array.from(text).forEach((character, index) => {
    drawGlyph(
      canvas,
      character,
      left + index * (FONT_WIDTH + 1) * scale + (FONT_WIDTH * scale) / 2,
      top + (FONT_HEIGHT * scale) / 2,
      scale,
      color,
      false,
    );
  });
}

/** Draws a glyph centered on (cx, cy), smoothing the bitmap so letters look rounded, not blocky. */
function drawGlyph(
  canvas: Canvas,
  character: string,
  cx: number,
  cy: number,
  scale: number,
  color: Rgb,
  fallbackDot: boolean,
) {
  const rows = getGlyph(character);
  if (!rows) {
    if (fallbackDot) {
      drawDisc(canvas, cx, cy, scale * 1.2, color);
    }
    return;
  }

  const left = cx - (FONT_WIDTH * scale) / 2;
  const top = cy - (FONT_HEIGHT * scale) / 2;
  for (let y = Math.floor(top); y < Math.ceil(top + FONT_HEIGHT * scale); y += 1) {
    for (let x = Math.floor(left); x < Math.ceil(left + FONT_WIDTH * scale); x += 1) {
      const column = (x + 0.5 - left) / scale - 0.5;
      const row = (y + 0.5 - top) / scale - 0.5;
      const value = sampleBilinear(rows, column, row);
      blend(canvas, x, y, color, smoothstep(0.3, 0.7, value));
    }
  }
}

function sampleBilinear(rows: number[][], column: number, row: number) {
  const x0 = Math.floor(column);
  const y0 = Math.floor(row);
  const fx = column - x0;
  const fy = row - y0;
  const at = (x: number, y: number) => rows[y]?.[x] ?? 0;

  return (
    at(x0, y0) * (1 - fx) * (1 - fy) +
    at(x0 + 1, y0) * fx * (1 - fy) +
    at(x0, y0 + 1) * (1 - fx) * fy +
    at(x0 + 1, y0 + 1) * fx * fy
  );
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getGlyph(character: string) {
  const key = character.toLocaleUpperCase();
  const cached = glyphCache.get(key);
  if (cached) {
    return cached;
  }
  const source = FONT[key];
  if (!source) {
    return undefined;
  }
  const rows = source.split(' ').map((row) => Array.from(row, (cell) => (cell === '1' ? 1 : 0)));
  glyphCache.set(key, rows);
  return rows;
}

/** First letter or digit of a name, without accents (Đ counts as D); other scripts get a dot. */
function getInitial(name: string) {
  const first = Array.from(
    name.trim().replace(/đ/gi, 'd').normalize('NFD').replace(/\p{M}/gu, ''),
  )[0];
  return first ?? '';
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodePng(canvas: Canvas) {
  const rowLength = canvas.width * 3;
  const raw = new Uint8Array((rowLength + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    raw[y * (rowLength + 1)] = 0;
    raw.set(canvas.data.subarray(y * rowLength, (y + 1) * rowLength), y * (rowLength + 1) + 1);
  }

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, canvas.width);
  view.setUint32(4, canvas.height);
  header[8] = 8; // bit depth
  header[9] = 2; // RGB

  return concat([
    Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(raw, { level: 3 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

function chunk(type: string, data: Uint8Array) {
  const typeBytes = Uint8Array.from(Array.from(type, (character) => character.charCodeAt(0)));
  const body = concat([typeBytes, data]);
  const length = new Uint8Array(4);
  new DataView(length.buffer).setUint32(0, data.length);
  const crc = new Uint8Array(4);
  new DataView(crc.buffer).setUint32(0, crc32(body));
  return concat([length, body, crc]);
}

function concat(parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
