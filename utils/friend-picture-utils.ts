import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Friend } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

// Pictures are saved small so a few hundred friends still fit in storage.
const PICTURE_SIZE = 128;
const PICTURE_QUALITY = 0.75;
const UNAVATAR_URL = 'https://unavatar.io';

export type SocialPictureSource = {
  /** Site the picture comes from, e.g. "Facebook". */
  label: string;
  url: string;
};

type SiteRule = {
  hosts: string[];
  label: string;
  provider: string;
  /** Pulls the handle out of the link's path parts; defaults to the first part. */
  handle?: (parts: string[], url: URL) => string | undefined;
};

const SITE_RULES: SiteRule[] = [
  {
    handle: (parts, url) =>
      parts[0] === 'profile.php' ? (url.searchParams.get('id') ?? undefined) : parts[0],
    hosts: ['facebook.com', 'fb.com', 'm.facebook.com'],
    label: 'Facebook',
    provider: 'facebook',
  },
  { hosts: ['instagram.com'], label: 'Instagram', provider: 'instagram' },
  { hosts: ['x.com', 'twitter.com'], label: 'X', provider: 'x' },
  { hosts: ['t.me', 'telegram.me'], label: 'Telegram', provider: 'telegram' },
  { hosts: ['github.com'], label: 'GitHub', provider: 'github' },
  { hosts: ['tiktok.com'], label: 'TikTok', provider: 'tiktok' },
  { hosts: ['youtube.com'], label: 'YouTube', provider: 'youtube' },
  { hosts: ['threads.net', 'threads.com'], label: 'Threads', provider: 'threads' },
  {
    handle: (parts) => (parts[0] === 'profile' ? parts[1] : undefined),
    hosts: ['bsky.app'],
    label: 'Bluesky',
    provider: 'bluesky',
  },
  {
    handle: (parts) => (parts[0] === 'user' || parts[0] === 'u' ? parts[1] : undefined),
    hosts: ['reddit.com'],
    label: 'Reddit',
    provider: 'reddit',
  },
  { hosts: ['twitch.tv'], label: 'Twitch', provider: 'twitch' },
  {
    handle: (parts) => parts[0],
    hosts: ['wa.me'],
    label: 'WhatsApp',
    provider: 'whatsapp',
  },
];

/** The picture to show for a friend: the one chosen by hand, else the fetched one. */
export function getFriendPicture(friend: Pick<Friend, 'picture' | 'socialPicture'> | undefined) {
  return friend?.picture || friend?.socialPicture || undefined;
}

/** Pictures by friend id and by lower-cased name, for looking up players on the map. */
export function getFriendPictureLookup(friends: Friend[]) {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const friend of friends) {
    const picture = getFriendPicture(friend);
    if (picture) {
      byId.set(friend.id, picture);
      byName.set(normalizePlayerName(friend.name).toLocaleLowerCase(), picture);
    }
  }
  return (player: { id: string; name: string }) =>
    byId.get(player.id) ?? byName.get(normalizePlayerName(player.name).toLocaleLowerCase());
}

/**
 * Where to fetch a profile picture for a typed-in link, handle, phone number or email.
 * Pictures come from unavatar.io, which looks them up on each site.
 */
export function getSocialPictureSource(input: string): SocialPictureSource | undefined {
  const text = input.trim();
  if (!text) {
    return undefined;
  }

  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(text)) {
    return { label: 'Gravatar', url: `${UNAVATAR_URL}/gravatar/${encodeURIComponent(text)}` };
  }

  // A phone number is looked up as a WhatsApp account.
  if (/^\+?[\d\s().-]{7,}$/.test(text)) {
    return getWhatsAppSource(text);
  }

  const url = parseUrl(text);
  if (!url) {
    return undefined;
  }

  const host = url.hostname.toLocaleLowerCase().replace(/^www\./, '');
  const rule = SITE_RULES.find((candidate) => candidate.hosts.includes(host));
  if (!rule) {
    return undefined;
  }

  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  const handle = (rule.handle ?? ((pathParts: string[]) => pathParts[0]))(parts, url)
    ?.replace(/^@/, '')
    .trim();
  if (!handle) {
    return undefined;
  }

  if (rule.provider === 'whatsapp') {
    return getWhatsAppSource(handle);
  }

  return {
    label: rule.label,
    url: `${UNAVATAR_URL}/${rule.provider}/${encodeURIComponent(handle)}`,
  };
}

/**
 * Downloads the picture and saves it small, so it shows offline and is only fetched once.
 * Falls back to the remote URL when the image can't be read (for example blocked on web).
 * Throws when the site has no picture for that account.
 */
export async function fetchSocialPicture(source: SocialPictureSource) {
  const response = await fetch(`${source.url}?fallback=false`);
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? 'Too many lookups today. Try again tomorrow, or choose an image.'
        : `No ${source.label} picture found.`,
    );
  }

  try {
    const blob = await response.blob();
    return await shrinkPicture(await blobToDataUrl(blob));
  } catch {
    return source.url;
  }
}

/** Lets the user pick an image file and returns it as a small data URI, or null if cancelled. */
export async function pickPictureFile(): Promise<string | null> {
  if (process.env.EXPO_OS === 'web') {
    const dataUrl = await pickWebImage();
    return dataUrl ? shrinkPicture(dataUrl) : null;
  }

  const result = await File.pickFileAsync({ mimeTypes: 'image/*' });
  if (result.canceled) {
    return null;
  }
  return shrinkPicture(result.result.uri);
}

/** A typed-in picture URL, or undefined if it isn't one. */
export function parsePictureUrl(input: string) {
  const text = input.trim();
  if (/^data:image\//i.test(text)) {
    return text;
  }
  const url = parseUrl(text);
  return url && /^https?:$/.test(url.protocol) ? url.toString() : undefined;
}

function getWhatsAppSource(phone: string): SocialPictureSource | undefined {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7
    ? { label: 'WhatsApp', url: `${UNAVATAR_URL}/whatsapp/phone:${digits}` }
    : undefined;
}

function parseUrl(text: string) {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return undefined;
  }
}

async function shrinkPicture(uri: string) {
  const image = ImageManipulator.manipulate(uri).resize({ width: PICTURE_SIZE });
  const rendered = await image.renderAsync();
  const result = await rendered.saveAsync({
    base64: true,
    compress: PICTURE_QUALITY,
    format: SaveFormat.JPEG,
  });
  if (!result.base64) {
    throw new Error('The picture could not be saved.');
  }
  return `data:image/jpeg;base64,${result.base64}`;
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function pickWebImage() {
  return new Promise<string | null>((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      void blobToDataUrl(file).then(resolve, reject);
    });
    input.click();
  });
}
