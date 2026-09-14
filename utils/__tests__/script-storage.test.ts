import type { Game, StoredScript } from '@/types/game';
import {
  normalizeRoleImagesInState,
  normalizeRoleImageUrls,
  restoreDuplicateScriptImages,
  restoreSushiBuffetScriptRoles,
  stripDuplicateScriptImages,
  stripSushiBuffetScriptRoles,
} from '@/utils/script-storage';

const dataImage = 'data:image/png;base64,encoded-image';

const script: StoredScript = {
  id: 'script-1',
  name: 'Homebrew',
  roles: [
    {
      id: 'custom_role',
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

const sushiRoles = [
  { ability: 'Learn an evil neighbor.', id: 'empath', name: 'Empath' },
  { ability: 'Learn a good player.', id: 'washerwoman', name: 'Washerwoman' },
  { ability: 'You are safe from the Demon.', id: 'soldier', name: 'Soldier' },
  { ability: 'You are the Demon.', id: 'imp', name: 'Imp' },
];

const sushiGame: Game = {
  ...game,
  script: {
    ...script,
    id: 'sushi-buffet',
    name: 'Sushi Buffet',
    roles: sushiRoles,
  },
  sushiRoleIds: ['empath', 'washerwoman', 'soldier'],
};

describe('script persistence image handling', () => {
  it('normalizes legacy imageUrl values without retaining the legacy field', () => {
    expect(
      normalizeRoleImageUrls({
        id: 'custom_role',
        imageUrl: dataImage,
        name: 'Custom Role',
      }),
    ).toEqual({
      id: 'custom_role',
      imageUrls: [dataImage],
      name: 'Custom Role',
    });

    expect(
      normalizeRoleImageUrls({
        id: 'custom_role',
        imageUrl: dataImage,
        imageUrls: ['https://example.com/role.webp'],
        name: 'Custom Role',
      }),
    ).toEqual({
      id: 'custom_role',
      imageUrls: ['https://example.com/role.webp'],
      name: 'Custom Role',
    });
  });

  it('normalizes legacy images across persisted scripts, catalogs, and game copies', () => {
    const legacyRole = {
      id: 'legacy_role',
      imageUrl: dataImage,
      name: 'Legacy Role',
    };
    const legacyScript = { ...script, roles: [legacyRole] as StoredScript['roles'] };
    const state = normalizeRoleImagesInState({
      games: [{ ...game, script: legacyScript }],
      roleCatalog: [legacyRole],
      scripts: [legacyScript],
    });

    expect(state.roleCatalog?.[0]).toEqual({
      id: 'legacy_role',
      imageUrls: [dataImage],
      name: 'Legacy Role',
    });
    expect(state.scripts?.[0]?.roles[0]).toEqual(state.roleCatalog?.[0]);
    expect(state.games?.[0]?.script?.roles[0]).toEqual(state.roleCatalog?.[0]);
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

  it('stores the smaller Sushi Buffet role set', () => {
    const [storedGame] = stripSushiBuffetScriptRoles([sushiGame]);

    expect(storedGame.script?.roles.map((role) => role.id)).toEqual(['imp']);
  });

  it('stores enabled Sushi Buffet roles when they are the smaller set', () => {
    const [storedGame] = stripSushiBuffetScriptRoles([{ ...sushiGame, sushiRoleIds: ['empath'] }]);

    expect(storedGame.script?.roles.map((role) => role.id)).toEqual(['empath']);
  });

  it('restores the full Sushi Buffet script from the role catalog', () => {
    const [storedGame] = stripSushiBuffetScriptRoles([sushiGame]);
    const [hydratedGame] = restoreSushiBuffetScriptRoles([storedGame], sushiRoles);

    expect(hydratedGame.script?.roles.map((role) => role.id)).toEqual(
      sushiRoles.map((role) => role.id),
    );
    expect(hydratedGame.script?.roles[0]?.ability).toBe(sushiRoles[0].ability);
  });
});
