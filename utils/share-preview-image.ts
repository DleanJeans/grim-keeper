import { zlibSync } from 'fflate';
import * as opentype from 'opentype.js';

import {
  getSharedCharacterCounts,
  getSharedScriptName,
  SHARE_PREVIEW_HEIGHT,
  SHARE_PREVIEW_WIDTH,
  type SharedGame,
} from '@/utils/share-game-codec';
import { GOOGLE_SANS_BOLD_BASE64, IM_FELL_ENGLISH_SC_BASE64 } from '@/utils/share-preview-fonts';

// Draws the link preview picture with no canvas or native modules, so it runs in the hosting
// server: glyph outlines from the app's own fonts are filled by a small anti-aliased rasterizer
// and the result is written as a PNG. The map is drawn like the app's Grimoire tokens.

const MARGIN = 30;
const DEFAULT_TOKEN_SIZE = 100;
const MIN_TOKEN_RADIUS = 16;
// Four sub-scanlines per pixel; horizontal coverage is exact.
const SUBSAMPLES = 4;
const CURVE_STEPS = 8;
const RIBBON_HALF_ANGLE = (58 * Math.PI) / 180;
const CAP_HEIGHT_RATIO = 0.68;

// Copies of the app's map and token colors (theme/colors.ts reads stored settings, which the
// server has none of).
const colors = {
  gameBackground: '#0b1120',
  gameBorder: '#334155',
  gameSurface: '#111827',
  gameText: '#f8fafc',
  gameTextSoft: '#cbd5e1',
  randomAccent: '#e2b04a',
  ribbon: '#5b2a17',
  ribbonText: '#f6ecd2',
  storytellerRibbon: '#7a5a12',
};
const tokenColors = {
  edge: '#3b2412',
  ink: '#4a2c14',
  parchmentCenter: '#f6ecd2',
  parchmentEdge: '#c9ad78',
  parchmentMiddle: '#e6d3a8',
  storytellerStar: '#7a5a12',
};

type Rgb = readonly [number, number, number];
type Point = { x: number; y: number };
type Polygon = Point[];
type Canvas = { data: Uint8Array; height: number; width: number };
type Fonts = { body: opentype.Font; token: opentype.Font };

let cachedFonts: Fonts | undefined;

export function createSharePreviewPng(sharedGame: SharedGame): Uint8Array {
  const fonts = getFonts();
  const canvas = createCanvas(
    SHARE_PREVIEW_WIDTH,
    SHARE_PREVIEW_HEIGHT,
    hexToRgb(colors.gameBackground),
  );
  const mapScale = Math.min(
    (SHARE_PREVIEW_HEIGHT - MARGIN * 2) / sharedGame.h,
    (SHARE_PREVIEW_WIDTH * 0.5) / sharedGame.w,
  );
  const mapWidth = Math.round(sharedGame.w * mapScale);
  const mapHeight = Math.round(sharedGame.h * mapScale);
  const mapLeft = MARGIN;
  const mapTop = Math.round((SHARE_PREVIEW_HEIGHT - mapHeight) / 2);

  fillRect(
    canvas,
    mapLeft - 3,
    mapTop - 3,
    mapWidth + 6,
    mapHeight + 6,
    hexToRgb(colors.gameBorder),
  );
  fillRect(canvas, mapLeft, mapTop, mapWidth, mapHeight, hexToRgb(colors.gameSurface));

  const radius = Math.max(
    MIN_TOKEN_RADIUS,
    (((sharedGame.t ?? DEFAULT_TOKEN_SIZE) * mapScale) / 2) * 0.94,
  );
  const tokenNames = getTokenNames(sharedGame.p.map((player) => player[0]));
  sharedGame.p.forEach(([name, , x, y, storyteller], index) => {
    drawToken(
      canvas,
      fonts,
      { x: mapLeft + x * mapScale, y: mapTop + y * mapScale },
      radius,
      name,
      tokenNames[index],
      !!storyteller,
    );
  });

  drawInfo(canvas, fonts, sharedGame, mapLeft + mapWidth + 50);

  return encodePng(canvas);
}

function getFonts(): Fonts {
  cachedFonts ??= {
    body: parseFont(GOOGLE_SANS_BOLD_BASE64),
    token: parseFont(IM_FELL_ENGLISH_SC_BASE64),
  };
  return cachedFonts;
}

function parseFont(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return opentype.parse(bytes.buffer);
}

/** What the app writes on a token: the first name, or the whole name when another shares it. */
function getTokenNames(names: string[]) {
  const normalized = names.map((name) => name.trim().replace(/\s+/g, ' '));
  const firstNames = normalized.map((name) => (name.split(' ')[0] ?? '').toLocaleLowerCase());

  return normalized.map((name, index) =>
    firstNames.some((other, otherIndex) => otherIndex !== index && other === firstNames[index])
      ? name
      : (name.split(' ')[0] ?? name),
  );
}

// ---------------------------------------------------------------------------------------------
// Tokens

function drawToken(
  canvas: Canvas,
  fonts: Fonts,
  center: Point,
  radius: number,
  fullName: string,
  tokenName: string,
  storyteller: boolean,
) {
  drawDisc(canvas, center, radius, hexToRgb(tokenColors.edge));
  drawDisc(
    canvas,
    center,
    radius - Math.max(2, radius * 0.07),
    hexToRgb(tokenColors.parchmentEdge),
  );
  drawDisc(
    canvas,
    center,
    radius - Math.max(3, radius * 0.12),
    hexToRgb(tokenColors.parchmentMiddle),
  );
  drawDisc(canvas, center, radius * 0.66, hexToRgb(tokenColors.parchmentCenter));

  const ribbonCenterRadius = radius * 0.64;
  const ribbonWidth = radius * 0.46;
  fillPolygons(
    canvas,
    [
      getRibbonPolygon(
        center,
        ribbonCenterRadius - ribbonWidth / 2,
        ribbonCenterRadius + ribbonWidth / 2,
      ),
    ],
    hexToRgb(storyteller ? colors.storytellerRibbon : colors.ribbon),
  );
  drawArcText(canvas, fonts.token, tokenName, center, ribbonCenterRadius, radius);

  if (storyteller) {
    fillPolygons(
      canvas,
      [getStarPolygon({ x: center.x, y: center.y - radius * 0.17 }, radius * 0.36)],
      hexToRgb(tokenColors.storytellerStar),
    );
    return;
  }

  const initial = getInitial(fullName, fonts.token);
  if (initial) {
    const size = radius * 0.8;
    const width = fonts.token.getAdvanceWidth(initial, size);
    fillPolygons(
      canvas,
      getTextPolygons(fonts.token, initial, center.x - width / 2, center.y + radius * 0.08, size),
      hexToRgb(tokenColors.ink),
      0.85,
    );
  }
}

/** The band along the bottom of a token, between two radii. */
function getRibbonPolygon(center: Point, innerRadius: number, outerRadius: number): Polygon {
  const steps = 24;
  const outer: Polygon = [];
  const inner: Polygon = [];
  for (let step = 0; step <= steps; step += 1) {
    const angle = -RIBBON_HALF_ANGLE + (2 * RIBBON_HALF_ANGLE * step) / steps;
    outer.push(pointOnCircle(center, outerRadius, angle));
    inner.push(pointOnCircle(center, innerRadius, angle));
  }
  return [...outer, ...inner.reverse()];
}

/** Angle 0 is straight down; it grows toward the right, so text reads left to right. */
function pointOnCircle(center: Point, radius: number, angle: number): Point {
  return { x: center.x + radius * Math.sin(angle), y: center.y + radius * Math.cos(angle) };
}

/** Writes the name along the ribbon, letters upright with their tops toward the center. */
function drawArcText(
  canvas: Canvas,
  font: opentype.Font,
  text: string,
  center: Point,
  ribbonCenterRadius: number,
  tokenRadius: number,
) {
  const glyphs = Array.from(text).filter((character) => font.charToGlyphIndex(character) > 0);
  if (glyphs.length === 0) {
    return;
  }

  // Fit the name between the ribbon's ends, at the app's relative size or smaller.
  const maxLength = tokenRadius * 1.5;
  const unitLength = font.getAdvanceWidth(glyphs.join(''), 1);
  const size = Math.min(tokenRadius * 0.38, maxLength / Math.max(0.01, unitLength));
  // Baseline on the outer side of the ribbon's middle so the capitals sit centered in the band.
  const baselineRadius = ribbonCenterRadius + (size * CAP_HEIGHT_RATIO) / 2;
  const advances = glyphs.map((glyph) => font.getAdvanceWidth(glyph, size));
  const total = advances.reduce((sum, advance) => sum + advance, 0);
  const polygons: Polygon[] = [];
  let offset = 0;

  glyphs.forEach((glyph, index) => {
    const advance = advances[index];
    const angle = (offset + advance / 2 - total / 2) / baselineRadius;
    offset += advance;
    const anchor = pointOnCircle(center, baselineRadius, angle);
    for (const polygon of getTextPolygons(font, glyph, -advance / 2, 0, size)) {
      // Rotating by -angle lays the glyph along the circle's tangent.
      const cos = Math.cos(-angle);
      const sin = Math.sin(-angle);
      polygons.push(
        polygon.map((point) => ({
          x: anchor.x + point.x * cos - point.y * sin,
          y: anchor.y + point.x * sin + point.y * cos,
        })),
      );
    }
  });

  fillPolygons(canvas, polygons, hexToRgb(colors.ribbonText));
}

function getStarPolygon(center: Point, size: number): Polygon {
  // A four-pointed star: points at the compass directions, pinched in between.
  const polygon: Polygon = [];
  for (let index = 0; index < 8; index += 1) {
    const angle = (index * Math.PI) / 4;
    const length = index % 2 === 0 ? size : size * 0.3;
    polygon.push({
      x: center.x + length * Math.sin(angle),
      y: center.y - length * Math.cos(angle),
    });
  }
  return polygon;
}

/** First letter or digit of a name without accents (Đ counts as D), if the font has it. */
function getInitial(name: string, font: opentype.Font) {
  const first = Array.from(
    name.trim().replace(/đ/gi, 'd').normalize('NFD').replace(/\p{M}/gu, ''),
  )[0]?.toLocaleUpperCase();

  return first && font.charToGlyphIndex(first) > 0 ? first : undefined;
}

// ---------------------------------------------------------------------------------------------
// Info column

function drawInfo(canvas: Canvas, fonts: Fonts, sharedGame: SharedGame, left: number) {
  const font = fonts.body;
  const maxWidth = canvas.width - left - MARGIN;
  const scriptName = getSharedScriptName(sharedGame) ?? 'Grim Keeper game';
  const seated = sharedGame.p.filter((player) => !player[4]).length;
  let titleSize = 84;
  let lines = wrapText(font, scriptName, maxWidth, titleSize);
  while (lines.length > 3 && titleSize > 40) {
    titleSize -= 4;
    lines = wrapText(font, scriptName, maxWidth, titleSize);
  }

  const counts = getSharedCharacterCounts(sharedGame);
  const ratio: Array<[number, string, string]> = [
    [counts.townsfolk, 'Townsfolk', '#60a5fa'],
    [counts.outsiders, counts.outsiders === 1 ? 'Outsider' : 'Outsiders', '#a5b4fc'],
    [counts.minions, counts.minions === 1 ? 'Minion' : 'Minions', '#fb923c'],
    [counts.demons, counts.demons === 1 ? 'Demon' : 'Demons', '#f87171'],
  ];
  const labelSize = 32;
  const titleLine = Math.round(titleSize * 1.12);
  const playersSize = 48;
  const ratioSize = 36;
  const ratioLine = Math.round(ratioSize * 1.45);
  const total =
    labelSize + 26 + lines.length * titleLine + 22 + playersSize + 22 + ratio.length * ratioLine;
  let y = Math.max(MARGIN, Math.round((canvas.height - total) / 2));

  drawText(canvas, font, 'GRIM KEEPER', left, y + labelSize, labelSize, colors.randomAccent);
  y += labelSize + 26;
  for (const line of lines) {
    drawText(canvas, font, line, left, y + titleSize, titleSize, colors.gameText);
    y += titleLine;
  }
  y += 22;
  drawText(
    canvas,
    font,
    `${seated} player${seated === 1 ? '' : 's'}`,
    left,
    y + playersSize * 0.9,
    playersSize,
    colors.gameText,
  );
  y += playersSize + 22;
  for (const [count, label, color] of ratio) {
    const baseline = y + ratioSize;
    drawDisc(canvas, { x: left + 12, y: baseline - ratioSize * 0.34 }, 11, hexToRgb(color));
    drawText(
      canvas,
      font,
      `${count} ${label}`,
      left + 38,
      baseline,
      ratioSize,
      colors.gameTextSoft,
    );
    y += ratioLine;
  }
}

function wrapText(font: opentype.Font, text: string, maxWidth: number, size: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.getAdvanceWidth(next, size) > maxWidth) {
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

function drawText(
  canvas: Canvas,
  font: opentype.Font,
  text: string,
  x: number,
  baseline: number,
  size: number,
  color: string,
) {
  fillPolygons(canvas, getTextPolygons(font, text, x, baseline, size), hexToRgb(color));
}

// ---------------------------------------------------------------------------------------------
// Rasterizer

/** Outlines of `text` with its baseline starting at (x, baseline), as closed polygons. */
function getTextPolygons(
  font: opentype.Font,
  text: string,
  x: number,
  baseline: number,
  size: number,
): Polygon[] {
  const supported = Array.from(text)
    .filter((character) => font.charToGlyphIndex(character) > 0 || character === ' ')
    .join('');
  const polygons: Polygon[] = [];
  let current: Polygon = [];
  let last: Point = { x: 0, y: 0 };
  const close = () => {
    if (current.length > 2) polygons.push(current);
    current = [];
  };

  for (const command of font.getPath(supported, x, baseline, size).commands) {
    if (command.type === 'M') {
      close();
      last = { x: command.x, y: command.y };
      current = [last];
    } else if (command.type === 'L') {
      last = { x: command.x, y: command.y };
      current.push(last);
    } else if (command.type === 'Q') {
      for (let step = 1; step <= CURVE_STEPS; step += 1) {
        const t = step / CURVE_STEPS;
        const u = 1 - t;
        current.push({
          x: u * u * last.x + 2 * u * t * command.x1 + t * t * command.x,
          y: u * u * last.y + 2 * u * t * command.y1 + t * t * command.y,
        });
      }
      last = { x: command.x, y: command.y };
    } else if (command.type === 'C') {
      for (let step = 1; step <= CURVE_STEPS; step += 1) {
        const t = step / CURVE_STEPS;
        const u = 1 - t;
        current.push({
          x:
            u ** 3 * last.x +
            3 * u * u * t * command.x1 +
            3 * u * t * t * command.x2 +
            t ** 3 * command.x,
          y:
            u ** 3 * last.y +
            3 * u * u * t * command.y1 +
            3 * u * t * t * command.y2 +
            t ** 3 * command.y,
        });
      }
      last = { x: command.x, y: command.y };
    } else if (command.type === 'Z') {
      close();
    }
  }
  close();

  return polygons;
}

type Edge = { dir: 1 | -1; slope: number; x0: number; y0: number; y1: number };

/** Fills polygons with the non-zero winding rule, blending `color` over the canvas. */
function fillPolygons(canvas: Canvas, polygons: Polygon[], color: Rgb, opacity = 1) {
  const edges: Edge[] = [];
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;

  for (const polygon of polygons) {
    for (let index = 0; index < polygon.length; index += 1) {
      const a = polygon[index];
      const b = polygon[(index + 1) % polygon.length];
      minX = Math.min(minX, a.x);
      maxX = Math.max(maxX, a.x);
      minY = Math.min(minY, a.y);
      maxY = Math.max(maxY, a.y);
      if (a.y === b.y) continue;
      const aIsLower = a.y < b.y;
      edges.push({
        dir: b.y > a.y ? 1 : -1,
        slope: (b.x - a.x) / (b.y - a.y),
        x0: aIsLower ? a.x : b.x,
        y0: aIsLower ? a.y : b.y,
        y1: aIsLower ? b.y : a.y,
      });
    }
  }
  if (edges.length === 0) return;

  const rowStart = Math.max(0, Math.floor(minY));
  const rowEnd = Math.min(canvas.height - 1, Math.ceil(maxY));
  const columnStart = Math.max(0, Math.floor(minX));
  const columnEnd = Math.min(canvas.width - 1, Math.ceil(maxX));
  const coverage = new Float32Array(columnEnd - columnStart + 2);
  // Edges crossing each pixel row, so a row only looks at its own.
  const rowEdges: Edge[][] = Array.from({ length: rowEnd - rowStart + 1 }, () => []);
  for (const edge of edges) {
    const first = Math.max(rowStart, Math.floor(edge.y0));
    const last = Math.min(rowEnd, Math.floor(edge.y1));
    for (let row = first; row <= last; row += 1) {
      rowEdges[row - rowStart].push(edge);
    }
  }

  for (let row = rowStart; row <= rowEnd; row += 1) {
    coverage.fill(0);
    let touched = false;
    const candidates = rowEdges[row - rowStart];
    for (let sample = 0; sample < SUBSAMPLES; sample += 1) {
      const y = row + (sample + 0.5) / SUBSAMPLES;
      const crossings: Array<[number, number]> = [];
      for (const edge of candidates) {
        if (y >= edge.y0 && y < edge.y1) {
          crossings.push([edge.x0 + (y - edge.y0) * edge.slope, edge.dir]);
        }
      }
      crossings.sort((first, second) => first[0] - second[0]);
      let winding = 0;
      for (let index = 0; index < crossings.length - 1; index += 1) {
        winding += crossings[index][1];
        if (winding === 0) continue;
        addSpan(coverage, crossings[index][0], crossings[index + 1][0], columnStart, columnEnd);
        touched = true;
      }
    }
    if (!touched) continue;
    for (let column = columnStart; column <= columnEnd; column += 1) {
      const alpha = Math.min(1, coverage[column - columnStart] / SUBSAMPLES) * opacity;
      blend(canvas, column, row, color, alpha);
    }
  }
}

function addSpan(
  coverage: Float32Array,
  from: number,
  to: number,
  columnStart: number,
  columnEnd: number,
) {
  const start = Math.max(from, columnStart);
  const end = Math.min(to, columnEnd + 1);
  if (end <= start) return;
  for (let column = Math.floor(start); column <= Math.floor(end - 1e-9); column += 1) {
    const overlap = Math.min(end, column + 1) - Math.max(start, column);
    if (overlap > 0) coverage[column - columnStart] += overlap;
  }
}

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

function drawDisc(canvas: Canvas, center: Point, radius: number, color: Rgb) {
  for (let y = Math.floor(center.y - radius - 1); y <= Math.ceil(center.y + radius + 1); y += 1) {
    for (let x = Math.floor(center.x - radius - 1); x <= Math.ceil(center.x + radius + 1); x += 1) {
      const distance = Math.hypot(x + 0.5 - center.x, y + 0.5 - center.y);
      blend(canvas, x, y, color, Math.min(1, Math.max(0, radius - distance + 0.5)));
    }
  }
}

function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

// ---------------------------------------------------------------------------------------------
// PNG

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
    chunk('IDAT', zlibSync(raw, { level: 1 })),
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
