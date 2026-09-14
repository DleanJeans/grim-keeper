jest.mock('expo-image-manipulator', () => ({
  ImageManipulator: { manipulate: jest.fn() },
  SaveFormat: { JPEG: 'jpeg', PNG: 'png', WEBP: 'webp' },
}));

import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import type { StoredScript } from '@/types/game';
import {
  formatScriptSize,
  getScriptSizeBytes,
  hasEmbeddedScriptImages,
  isCustomScript,
  resizeScriptImages,
} from '@/utils/script-image-utils';
import { OFFICIAL_SCRIPT_AUTHOR } from '@/utils/script-service';

const manipulate = ImageManipulator.manipulate as unknown as jest.Mock;

function createScript(overrides: Partial<StoredScript> = {}): StoredScript {
  return {
    id: 'custom-script',
    name: 'Custom Script',
    roles: [],
    updatedAt: '2026-09-14T00:00:00.000Z',
    version: '1.0.0',
    ...overrides,
  };
}

describe('script image utilities', () => {
  beforeEach(() => {
    manipulate.mockReset();
  });

  it('recognizes imported custom scripts but not official or built-in scripts', () => {
    expect(isCustomScript(createScript())).toBe(true);
    expect(
      isCustomScript(
        createScript({ author: OFFICIAL_SCRIPT_AUTHOR, id: 'trouble-brewing', remoteId: 178 }),
      ),
    ).toBe(false);
    expect(
      isCustomScript(
        createScript({ author: OFFICIAL_SCRIPT_AUTHOR, id: 'carousel', remoteId: undefined }),
      ),
    ).toBe(false);
    expect(isCustomScript(createScript({ id: 'sushi-buffet' }))).toBe(false);
    expect(isCustomScript(createScript({ remoteId: 42 }))).toBe(false);
  });

  it('formats serialized script sizes', () => {
    expect(formatScriptSize(512)).toBe('512 B');
    expect(formatScriptSize(1024)).toBe('1.0 KB');
    expect(formatScriptSize(1024 * 1024)).toBe('1.0 MB');
  });

  it('measures serialized scripts and detects embedded images', () => {
    const script = createScript({
      roles: [
        {
          id: 'custom-role',
          imageUrl: 'data:image/png;base64,encoded',
          name: 'Custom Role',
        },
      ],
    });

    expect(getScriptSizeBytes(script)).toBeGreaterThan(0);
    expect(hasEmbeddedScriptImages(script)).toBe(true);
    expect(
      hasEmbeddedScriptImages(
        createScript({
          roles: [
            { id: 'remote-role', imageUrl: 'https://example.com/role.png', name: 'Remote Role' },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('resizes data images by height, preserves format, and reuses duplicate URLs', async () => {
    const resize = jest.fn().mockReturnThis();
    const saveAsync = jest
      .fn()
      .mockImplementation(({ format }: { format: SaveFormat }) =>
        Promise.resolve({ base64: format === SaveFormat.JPEG ? 'jpeg-data' : 'png-data' }),
      );
    const renderAsync = jest.fn().mockResolvedValue({ saveAsync });
    manipulate.mockReturnValue({ renderAsync, resize });

    const sharedPng = 'data:image/png;base64,shared';
    const script = createScript({
      roles: [
        {
          id: 'png-role',
          imageUrl: sharedPng,
          imageUrls: [sharedPng, 'https://example.com/role.png'],
          name: 'PNG Role',
        },
        {
          id: 'jpeg-role',
          imageUrl: 'data:image/jpeg;base64,jpeg',
          name: 'JPEG Role',
        },
      ],
    });

    const resizedScript = await resizeScriptImages(script, 100);

    expect(manipulate).toHaveBeenCalledTimes(2);
    expect(resize).toHaveBeenCalledTimes(2);
    expect(resize).toHaveBeenNthCalledWith(1, { height: 100 });
    expect(resize).toHaveBeenNthCalledWith(2, { height: 100 });
    expect(saveAsync).toHaveBeenNthCalledWith(1, {
      base64: true,
      format: SaveFormat.PNG,
    });
    expect(saveAsync).toHaveBeenNthCalledWith(2, {
      base64: true,
      format: SaveFormat.JPEG,
    });
    expect(resizedScript.roles).toEqual([
      {
        id: 'png-role',
        imageUrl: 'data:image/png;base64,png-data',
        imageUrls: ['data:image/png;base64,png-data', 'https://example.com/role.png'],
        name: 'PNG Role',
      },
      {
        id: 'jpeg-role',
        imageUrl: 'data:image/jpeg;base64,jpeg-data',
        name: 'JPEG Role',
      },
    ]);
  });

  it('propagates image manipulation failures without returning a partial script', async () => {
    const resize = jest.fn().mockReturnThis();
    const renderAsync = jest.fn().mockResolvedValue({
      saveAsync: jest.fn().mockRejectedValue(new Error('resize failed')),
    });
    manipulate.mockReturnValue({ renderAsync, resize });

    await expect(
      resizeScriptImages(
        createScript({
          roles: [{ id: 'role', imageUrl: 'data:image/png;base64,encoded', name: 'Role' }],
        }),
        100,
      ),
    ).rejects.toThrow('resize failed');
  });
});
