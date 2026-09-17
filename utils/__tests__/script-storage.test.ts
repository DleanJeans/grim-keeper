import type { Game, StoredScript } from '@/types/game';
import {
  normalizeRoleImagesInState,
  normalizeRoleImageUrls,
  restoreDuplicateScriptImages,
  restoreGameScripts,
  restoreStoredScript,
  restoreSushiBuffetScriptRoles,
  serializeGameScripts,
  serializeStoredScript,
  stripDuplicateScriptImages,
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

  it('omits the Sushi Buffet script and stores its role IDs on the game', () => {
    const [storedGame] = serializeGameScripts([sushiGame]);

    expect(storedGame).not.toHaveProperty('script');
    expect(storedGame.scriptRoleIds).toEqual(sushiRoles.map((role) => role.id));
    expect(storedGame.sushiRoleIds).toEqual(sushiGame.sushiRoleIds);
  });

  it('restores a missing Sushi Buffet script from compact role IDs', () => {
    const [storedGame] = serializeGameScripts([sushiGame]);
    const [hydratedGame] = restoreSushiBuffetScriptRoles(
      restoreGameScripts([storedGame]),
      sushiRoles,
    );

    expect(hydratedGame.script?.roles.map((role) => role.id)).toEqual(
      sushiRoles.map((role) => role.id),
    );
    expect(hydratedGame.script?.roles[0]?.ability).toBe(sushiRoles[0].ability);
  });

  it('normalizes generated official names and keeps hydrated role references compact', () => {
    const role = {
      edition: 'bmr',
      id: 'devilsadvocate',
      name: 'Devilsadvocate',
      team: 'minion',
    };
    const serialized = serializeStoredScript({ ...script, roles: [role] });

    expect(serialized.roles).toEqual(['devilsadvocate']);
    expect(restoreStoredScript(serialized).roles).toEqual([
      { id: 'devilsadvocate', name: "Devil's Advocate" },
    ]);
    expect(
      serializeStoredScript({
        ...script,
        roles: [{ id: 'devilsadvocate', name: "Devil's Advocate" }],
      }).roles,
    ).toEqual(['devilsadvocate']);
  });

  it('serializes canonical loric and fabled roles as IDs', () => {
    const loricRole = {
      ability: 'A loric ability.',
      edition: 'loric',
      id: 'loric_role',
      name: 'Loric Role',
      team: 'loric',
    };
    const fabledRole = {
      ability: 'A fabled ability.',
      edition: 'fabled',
      id: 'fabled_role',
      name: 'Fabled Role',
      team: 'fabled',
    };
    const customRole = { edition: 'homebrew', id: 'custom_role', name: 'Custom Role' };
    const storedScript = {
      ...script,
      roles: [loricRole, fabledRole, customRole],
    };

    const serialized = serializeStoredScript(storedScript, [loricRole, fabledRole]);

    expect(serialized.roles).toEqual(['loric_role', 'fabled_role', customRole]);
    expect(restoreStoredScript(serialized, [loricRole, fabledRole]).roles).toEqual(
      storedScript.roles,
    );
  });

  it('keeps app-local role notes in the serialized object', () => {
    const catalogRole = {
      ability: 'A loric ability.',
      edition: 'loric',
      id: 'loric_role',
      name: 'Loric Role',
      team: 'loric',
    };
    const roleWithNote = { ...catalogRole, notes: ['Keep this role in mind.'] };

    expect(
      serializeStoredScript({ ...script, roles: [roleWithNote] }, [catalogRole]).roles,
    ).toEqual([roleWithNote]);
  });
});
