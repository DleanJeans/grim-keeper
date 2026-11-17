import { unzlibSync } from 'fflate';

import type { SharedGame } from '@/utils/share-game-codec';

// Character icons for the link preview picture. The hosting server has no image library, so
// each icon comes through a public image converter as a small PNG that is decoded here. Every
// step is best effort: whatever fails just leaves that icon (or all of them) out of the picture.

const ROLE_CATALOG_URL = 'https://release.botc.app/resources/data/roles.json';
const ROLE_SITE_URL = 'https://release.botc.app';
const SCRIPT_API_URL = 'https://www.botcscripts.com/api/scripts';
const IMAGE_CONVERTER_URL = 'https://wsrv.nl/';
const MAX_ICONS = 40;
// The official scripts have no BotC Scripts number, so their characters come from the catalog.
const OFFICIAL_EDITIONS: Record<string, string[]> = {
  'bad-moon-rising': ['bmr', 'bad moon rising'],
  'sects-and-violets': ['snv', 'sects and violets'],
  'trouble-brewing': ['tb', 'trouble brewing'],
};
const EXTRA_TEAMS = ['traveller', 'traveler', 'fabled', 'loric'];
const DEADLINE_MS = 3500;

export const PREVIEW_ICON_PIXELS = 112;

export type PreviewIcon = { height: number; rgba: Uint8Array; width: number };
export type PreviewIcons = { icons: PreviewIcon[]; note: string };

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<Response>;

/** True when the shared script lists its characters somewhere the server can read them. */
export function hasPreviewScript(sharedGame: SharedGame) {
  if (sharedGame.sr || sharedGame.su) {
    return false;
  }

  return (
    !!sharedGame.s ||
    sharedGame.r?.remoteId !== undefined ||
    (!!sharedGame.r && sharedGame.r.id in OFFICIAL_EDITIONS)
  );
}

export async function loadPreviewIcons(
  sharedGame: SharedGame,
  fetchImpl: FetchLike = fetch,
  deadlineMs = DEADLINE_MS,
): Promise<PreviewIcons> {
  if (!hasPreviewScript(sharedGame)) {
    return { icons: [], note: 'no script to list' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deadlineMs);
  const fetchWithDeadline: FetchLike = (url) => fetchImpl(url, { signal: controller.signal });
  const trace: string[] = [];

  try {
    const [scriptIds, catalogResult] = await Promise.all([
      getScriptRoleIds(sharedGame, fetchWithDeadline, trace),
      getIconUrlsById(fetchWithDeadline, trace, sharedGame.r?.id),
    ]);
    const catalog = catalogResult.urls;
    const roleIds = scriptIds.length > 0 ? scriptIds : catalogResult.officialIds;
    const urls = roleIds
      .map((id) => catalog.get(id))
      .filter((url): url is string => !!url)
      .slice(0, MAX_ICONS);
    trace.push(`${urls.length} of ${roleIds.length} characters have an icon address`);
    if (urls.length === 0) {
      return { icons: [], note: trace.join('; ') };
    }

    const errors: string[] = [];
    const results = await Promise.all(
      urls.map(async (url) => {
        try {
          return await fetchIcon(url, fetchWithDeadline);
        } catch (error) {
          errors.push(error instanceof Error ? error.message : 'failed');
          return undefined;
        }
      }),
    );
    const icons = results.filter((icon): icon is PreviewIcon => !!icon);
    trace.push(`${icons.length} of ${urls.length} icons loaded`);
    if (errors.length > 0) {
      trace.push(`first icon error: ${errors[0]}`);
    }

    return { icons, note: trace.join('; ') };
  } catch (error) {
    trace.push(error instanceof Error ? `${error.name}: ${error.message}` : 'failed');
    return { icons: [], note: trace.join('; ') };
  } finally {
    clearTimeout(timer);
  }
}

async function getScriptRoleIds(sharedGame: SharedGame, fetchImpl: FetchLike, trace: string[]) {
  if (sharedGame.s) {
    trace.push('script sent in the link');
    return unique(sharedGame.s.roles.map((role) => (typeof role === 'string' ? role : role.id)));
  }

  const remoteId = sharedGame.r?.remoteId;
  if (remoteId === undefined) {
    return [];
  }

  const response = await fetchImpl(`${SCRIPT_API_URL}/${remoteId}/json`);
  if (!response.ok) {
    throw new Error(`script download ${response.status}`);
  }

  const content: unknown = await response.json();
  const ids = Array.isArray(content) ? unique(content.map(getEntryId)) : [];
  trace.push(`script ${remoteId} lists ${ids.length} characters`);
  return ids;
}

function getEntryId(entry: unknown) {
  const id = typeof entry === 'string' ? entry : (entry as { id?: unknown } | null | undefined)?.id;
  return typeof id === 'string' && id !== '_meta' ? id : '';
}

function unique(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

async function getIconUrlsById(fetchImpl: FetchLike, trace: string[], referenceId?: string) {
  const response = await fetchImpl(ROLE_CATALOG_URL);
  if (!response.ok) {
    throw new Error(`catalog download ${response.status}`);
  }

  const content: unknown = await response.json();
  const entries = Array.isArray(content)
    ? content
    : (Object.values((content ?? {}) as Record<string, unknown>).find(Array.isArray) ?? []);
  const urls = new Map<string, string>();
  const officialIds: string[] = [];
  const editions = (referenceId && OFFICIAL_EDITIONS[referenceId]) || [];
  for (const entry of entries as unknown[]) {
    const candidate = entry as Record<string, unknown> | null;
    const id = typeof candidate?.id === 'string' ? candidate.id : '';
    const images = [candidate?.image, candidate?.imageUrls, candidate?.imageUrl].flat();
    const image = images.find((value): value is string => typeof value === 'string' && !!value);
    if (id && image && !urls.has(id)) {
      urls.set(id, new URL(image.trim(), ROLE_SITE_URL).href);
    }
    const edition = typeof candidate?.edition === 'string' ? candidate.edition.toLowerCase() : '';
    const team = typeof candidate?.team === 'string' ? candidate.team.toLowerCase() : '';
    if (id && editions.includes(edition) && !EXTRA_TEAMS.includes(team)) {
      officialIds.push(id);
    }
  }

  const sample = (entries[0] ? Object.keys(entries[0] as object) : []).slice(0, 8).join(',');
  trace.push(
    `catalog has ${entries.length} entries, ${urls.size} with an image (fields: ${sample})`,
  );
  if (referenceId && editions.length > 0) {
    trace.push(`${officialIds.length} characters in the ${referenceId} edition`);
  }
  return { officialIds: unique(officialIds), urls };
}

async function fetchIcon(url: string, fetchImpl: FetchLike) {
  const converted = `${IMAGE_CONVERTER_URL}?url=${encodeURIComponent(url)}&w=${PREVIEW_ICON_PIXELS}&h=${PREVIEW_ICON_PIXELS}&fit=cover&output=png`;
  const response = await fetchImpl(converted);
  if (!response.ok) {
    throw new Error(`icon ${response.status}`);
  }

  return decodePng(new Uint8Array(await response.arrayBuffer()));
}

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

/** Decodes a plain 8 bit PNG (any colour type, no interlacing) to RGBA. */
export function decodePng(bytes: Uint8Array): PreviewIcon {
  if (PNG_SIGNATURE.some((value, index) => bytes[index] !== value)) {
    throw new Error('not a PNG');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Uint8Array = new Uint8Array(0);
  let transparency: Uint8Array = new Uint8Array(0);
  const parts: Uint8Array[] = [];

  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    const body = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = view.getUint32(offset + 8);
      height = view.getUint32(offset + 12);
      bitDepth = body[8];
      colorType = body[9];
      interlace = body[12];
    } else if (type === 'PLTE') {
      palette = body;
    } else if (type === 'tRNS') {
      transparency = body;
    } else if (type === 'IDAT') {
      parts.push(body);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }

  const channels = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colorType];
  if (!width || !height || bitDepth !== 8 || interlace !== 0 || !channels) {
    throw new Error('unsupported PNG');
  }

  const raw = unzlibSync(concat(parts));
  const stride = width * channels;
  const pixels = new Uint8Array(stride * height);
  for (let row = 0; row < height; row += 1) {
    const filter = raw[row * (stride + 1)];
    const source = row * (stride + 1) + 1;
    for (let column = 0; column < stride; column += 1) {
      const left = column >= channels ? pixels[row * stride + column - channels] : 0;
      const up = row > 0 ? pixels[(row - 1) * stride + column] : 0;
      const upLeft =
        row > 0 && column >= channels ? pixels[(row - 1) * stride + column - channels] : 0;
      pixels[row * stride + column] =
        (raw[source + column] + getPredictor(filter, left, up, upLeft)) & 255;
    }
  }

  const rgba = new Uint8Array(width * height * 4);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const from = pixel * channels;
    const to = pixel * 4;
    if (colorType === 6) {
      rgba.set(pixels.subarray(from, from + 4), to);
    } else if (colorType === 2) {
      rgba.set(pixels.subarray(from, from + 3), to);
      rgba[to + 3] = 255;
    } else if (colorType === 0) {
      rgba.set([pixels[from], pixels[from], pixels[from], 255], to);
    } else if (colorType === 4) {
      rgba.set([pixels[from], pixels[from], pixels[from], pixels[from + 1]], to);
    } else {
      const index = pixels[from];
      rgba.set(palette.subarray(index * 3, index * 3 + 3), to);
      rgba[to + 3] = transparency[index] ?? 255;
    }
  }

  return { height, rgba, width };
}

function getPredictor(filter: number, left: number, up: number, upLeft: number) {
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return (left + up) >> 1;
  if (filter === 4) {
    const estimate = left + up - upLeft;
    const distanceLeft = Math.abs(estimate - left);
    const distanceUp = Math.abs(estimate - up);
    const distanceUpLeft = Math.abs(estimate - upLeft);
    if (distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft) return left;
    return distanceUp <= distanceUpLeft ? up : upLeft;
  }
  return 0;
}

function concat(parts: Uint8Array[]) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
}
