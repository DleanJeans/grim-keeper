import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Friend } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

// Pictures are saved small so a few hundred friends still fit in storage.
const PICTURE_SIZE = 128;
const PICTURE_QUALITY = 0.75;

/** The picture to show for a friend. */
export function getFriendPicture(friend: Pick<Friend, 'picture'> | undefined) {
  return friend?.picture || undefined;
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
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`);
    return /^https?:$/.test(url.protocol) && url.hostname.includes('.')
      ? url.toString()
      : undefined;
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
