import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export type PickedJsonFile = {
  name: string;
  size: number;
  text: string;
};

export function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function shareJsonFile(json: string, filename: string, dialogTitle: string) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing is not available on this device.');
  }

  const file = new File(Paths.cache, filename);
  file.write(json);

  try {
    await Sharing.shareAsync(file.uri, {
      dialogTitle,
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  } finally {
    file.delete();
  }
}

export async function pickJsonFile(): Promise<PickedJsonFile | null> {
  if (process.env.EXPO_OS === 'web') {
    return pickWebJsonFile();
  }

  const result = await File.pickFileAsync({ mimeTypes: 'application/json' });

  if (result.canceled) {
    return null;
  }

  const file = result.result;
  return {
    name: file.name,
    size: file.info().size ?? 0,
    text: await file.text(),
  };
}

export function getJsonFilename(prefix: string) {
  return `${prefix}-${new Date().toISOString().replaceAll(':', '-')}.json`;
}

function pickWebJsonFile(): Promise<PickedJsonFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];

      if (!file) {
        resolve(null);
        return;
      }

      void file.text().then((text) => resolve({ name: file.name, size: file.size, text }), reject);
    });
    input.click();
  });
}
