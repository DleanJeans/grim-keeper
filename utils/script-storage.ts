import type { Game, Role, StoredScript } from '@/types/game';
import { mergeRoleCatalogMetadata } from '@/utils/role-utils';
import { SUSHI_BUFFET_SCRIPT_ID } from '@/utils/script-constants';

type LegacyRole = Role & { imageUrl?: string };

type RoleImageState = {
  games?: Game[];
  roleCatalog?: Role[];
  scripts?: StoredScript[];
};

export function stripSushiBuffetScriptRoles(games: Game[]) {
  return games.map((game) => {
    const script = game.script;
    if (script?.id !== SUSHI_BUFFET_SCRIPT_ID) {
      return game;
    }

    const enabledRoleIds = new Set(game.sushiRoleIds ?? script.roles.map((role) => role.id));
    const enabledRoles = script.roles.filter((role) => enabledRoleIds.has(role.id));
    const disabledRoles = script.roles.filter((role) => !enabledRoleIds.has(role.id));
    const roles = enabledRoles.length <= disabledRoles.length ? enabledRoles : disabledRoles;

    return {
      ...game,
      script: { ...script, roles },
    };
  });
}

export function restoreSushiBuffetScriptRoles(games: Game[], roleCatalog: Role[]) {
  return games.map((game) => {
    const script = game.script;
    if (script?.id !== SUSHI_BUFFET_SCRIPT_ID) {
      return game;
    }

    const rolesById = new Map([...roleCatalog, ...script.roles].map((role) => [role.id, role]));

    return {
      ...game,
      script: {
        ...script,
        roles: mergeRoleCatalogMetadata([...rolesById.values()], roleCatalog),
      },
    };
  });
}

export function stripDuplicateScriptImages(games: Game[], scripts: StoredScript[]) {
  const scriptIds = new Set(scripts.map((script) => script.id));

  return games.map((game) => {
    if (!game.script || !scriptIds.has(game.script.id)) {
      return game;
    }

    return {
      ...game,
      script: {
        ...game.script,
        roles: game.script.roles.map(stripRoleImages),
      },
    };
  });
}

export function restoreDuplicateScriptImages(games: Game[], scripts: StoredScript[]) {
  const scriptsById = new Map(scripts.map((script) => [script.id, script]));

  return games.map((game) => {
    const script = game.script;
    const storedScript = script ? scriptsById.get(script.id) : undefined;

    if (!script || !storedScript) {
      return game;
    }

    const imagesByRoleId = new Map(
      storedScript.roles.map((role) => [role.id, getRoleImages(role)]),
    );

    return {
      ...game,
      script: {
        ...script,
        roles: script.roles.map((role) => {
          const images = imagesByRoleId.get(role.id);
          return images ? { ...role, ...images } : role;
        }),
      },
    };
  });
}

export function normalizeRoleImageUrls(role: LegacyRole): Role {
  const { imageUrl, imageUrls, ...roleWithoutImageUrl } = role;
  const normalizedImageUrls = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : undefined;

  return {
    ...roleWithoutImageUrl,
    ...(normalizedImageUrls ? { imageUrls: normalizedImageUrls } : {}),
  };
}

export function normalizeStoredScriptImages(script: StoredScript): StoredScript {
  return {
    ...script,
    roles: script.roles.map(normalizeRoleImageUrls),
  };
}

export function normalizeGameScriptImages(game: Game): Game {
  return game.script ? { ...game, script: normalizeStoredScriptImages(game.script) } : game;
}

export function normalizeRoleImagesInState<T extends RoleImageState>(state: T): T {
  return {
    ...state,
    ...(state.games ? { games: state.games.map(normalizeGameScriptImages) } : {}),
    ...(state.roleCatalog ? { roleCatalog: state.roleCatalog.map(normalizeRoleImageUrls) } : {}),
    ...(state.scripts ? { scripts: state.scripts.map(normalizeStoredScriptImages) } : {}),
  } as T;
}

function stripRoleImages(role: Role): Role {
  const { imageUrls, ...roleWithoutImages } = role;
  const remainingImageUrls = imageUrls?.filter((image) => !isDataImageUrl(image));

  return {
    ...roleWithoutImages,
    ...(remainingImageUrls?.length ? { imageUrls: remainingImageUrls } : {}),
  };
}

function getRoleImages(role: Role) {
  return role.imageUrls?.length ? { imageUrls: role.imageUrls } : {};
}

function isDataImageUrl(value: string) {
  return value.startsWith('data:image/');
}
