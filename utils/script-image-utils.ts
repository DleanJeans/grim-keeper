import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { Role, StoredScript } from '@/types/game';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';
import { OFFICIAL_SCRIPT_AUTHOR } from '@/utils/script-service';

const DATA_IMAGE_PREFIX = 'data:image/';

export function isCustomScript(script: Pick<StoredScript, 'author' | 'id' | 'remoteId'>) {
  return (
    script.remoteId === undefined &&
    script.author !== OFFICIAL_SCRIPT_AUTHOR &&
    script.id !== SUSHI_BUFFET_SCRIPT_ID
  );
}

export function getScriptSizeBytes(script: StoredScript) {
  return new Blob([JSON.stringify(script)]).size;
}

export function formatScriptSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function hasEmbeddedScriptImages(script: StoredScript) {
  return script.roles.some((role) => getRoleImageUrls(role).some(isDataImageUrl));
}

export async function resizeScriptImages(script: StoredScript, targetHeight: number) {
  const resizedImages = new Map<string, Promise<string>>();
  const roles = await Promise.all(
    script.roles.map(async (role) => {
      const nextImageUrls = role.imageUrls
        ? await Promise.all(
            role.imageUrls.map((imageUrl) => resizeImageUrl(imageUrl, targetHeight, resizedImages)),
          )
        : undefined;

      return {
        ...role,
        ...(nextImageUrls ? { imageUrls: nextImageUrls } : {}),
      };
    }),
  );

  return { ...script, roles };
}

function getRoleImageUrls(role: Role) {
  return role.imageUrls ?? [];
}

function isDataImageUrl(value: string) {
  return value.startsWith(DATA_IMAGE_PREFIX);
}

function resizeImageUrl(
  imageUrl: string,
  targetHeight: number,
  resizedImages: Map<string, Promise<string>>,
): Promise<string> {
  if (!isDataImageUrl(imageUrl)) {
    return Promise.resolve(imageUrl);
  }

  const existingResize = resizedImages.get(imageUrl);
  if (existingResize) {
    return existingResize;
  }

  const resize = resizeDataImage(imageUrl, targetHeight);
  resizedImages.set(imageUrl, resize);
  return resize;
}

async function resizeDataImage(dataUrl: string, targetHeight: number) {
  const { format, mimeType } = getImageFormat(dataUrl);
  const image = ImageManipulator.manipulate(dataUrl).resize({ height: targetHeight });
  const renderedImage = await image.renderAsync();
  const result = await renderedImage.saveAsync({ base64: true, format });

  if (!result.base64) {
    throw new Error('The resized image did not include base64 data.');
  }

  return `data:${mimeType};base64,${result.base64}`;
}

function getImageFormat(dataUrl: string) {
  const mimeType = /^data:(image\/[a-z0-9.+-]+);base64,/i.exec(dataUrl)?.[1]?.toLocaleLowerCase();

  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return { format: SaveFormat.JPEG, mimeType: 'image/jpeg' };
  }

  if (mimeType === 'image/webp') {
    return { format: SaveFormat.WEBP, mimeType: 'image/webp' };
  }

  return { format: SaveFormat.PNG, mimeType: 'image/png' };
}
