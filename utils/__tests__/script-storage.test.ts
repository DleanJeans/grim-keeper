import type { Game, StoredScript } from '@/types/game';
import {
  restoreDuplicateScriptImages,
  restoreRedundantRoleImageUrl,
  stripDuplicateScriptImages,
  stripRedundantRoleImageUrl,
} from '@/utils/script-storage';

const dataImage = 'data:image/png;base64,encoded-image';

const script: StoredScript = {
  id: 'script-1',
  name: 'Homebrew',
  roles: [
    {
      id: 'custom_role',
      imageUrl: dataImage,
      imageUrls: [dataImage, 'https://example.com/evil.webp'],
      name: 'Custom Role',
    },
  ],
  updatedAt: '2026-07-30T00:00:00.000Z',
  version: '1.0.0',
};

const game: Game = {
  activeDay: 1,
  conversations: [],
  createdAt: '2026-07-30T00:00:00.000Z',
  id: 'game-1',
  players: [],
  script,
  updatedAt: '2026-07-30T00:00:00.000Z',
};

describe('script persistence image handling', () => {
  it('strips and restores a redundant single role image URL', () => {
    const role = {
      id: 'custom_role',
      imageUrl: dataImage,
      imageUrls: [dataImage],
      name: 'Custom Role',
    };

    expect(stripRedundantRoleImageUrl(role)).toEqual({
      id: 'custom_role',
      imageUrls: [dataImage],
      name: 'Custom Role',
    });
    expect(restoreRedundantRoleImageUrl(stripRedundantRoleImageUrl(role))).toEqual(role);
  });

  it('strips duplicate data images from games but keeps external URLs', () => {
    const [storedGame] = stripDuplicateScriptImages([game], [script]);
    const [role] = storedGame.script?.roles ?? [];

    expect(role).toEqual({
      id: 'custom_role',
      imageUrls: ['https://example.com/evil.webp'],
      name: 'Custom Role',
    });
  });

  it('restores duplicate images from the saved script after hydration', () => {
    const [storedGame] = stripDuplicateScriptImages([game], [script]);
    const [hydratedGame] = restoreDuplicateScriptImages([storedGame], [script]);

    expect(hydratedGame.script?.roles[0]).toEqual(script.roles[0]);
  });

  it('does not strip games whose script is not separately saved', () => {
    expect(stripDuplicateScriptImages([game], [])).toEqual([game]);
  });
});
