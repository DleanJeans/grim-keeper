import type { Game, Role, StoredScript } from '@/types/game';
import {
  formatRoleId,
  isGeneratedRoleName,
  isOfficialRole,
  mergeRoleCatalogMetadata,
} from '@/utils/role-utils';
import { SUSHI_BUFFET_SCRIPT_ID, SUSHI_BUFFET_SCRIPT_NAME } from '@/utils/script-constants';

type LegacyRole = Role & { imageUrl?: string };

export type SerializedRole = Role | string;

export type SerializedStoredScript = Omit<StoredScript, 'roles'> & {
  roles: SerializedRole[];
};

export type SerializedGame = Omit<Game, 'script'> & {
  script?: SerializedStoredScript;
};

type RoleImageState = {
  games?: Game[];
  roleCatalog?: Role[];
  scripts?: StoredScript[];
};

export function restoreSushiBuffetScriptRoles(games: Game[], roleCatalog: Role[]) {
  return games.map((game) => {
    if (game.script?.id !== SUSHI_BUFFET_SCRIPT_ID && game.scriptId !== SUSHI_BUFFET_SCRIPT_ID) {
      return game;
    }

    const script =
      game.script?.id === SUSHI_BUFFET_SCRIPT_ID
        ? game.script
        : {
            id: SUSHI_BUFFET_SCRIPT_ID,
            name: SUSHI_BUFFET_SCRIPT_NAME,
            version: '1.0.0',
            roles: [],
            updatedAt: '',
          };
    const roleIds = [...(game.scriptRoleIds ?? game.sushiRoleIds ?? [])].filter(
      (roleId, index, allRoleIds) => roleId && allRoleIds.indexOf(roleId) === index,
    );
    const fallbackRoles = roleIds.map((id) => ({ id, name: formatRoleId(id) }));
    const roleIdsInSnapshot = game.scriptRoleIds ? new Set(game.scriptRoleIds) : undefined;
    const catalogRoles = roleIdsInSnapshot
      ? roleCatalog.filter((role) => roleIdsInSnapshot.has(role.id))
      : roleCatalog;
    const rolesById = new Map(
      [...catalogRoles, ...fallbackRoles, ...script.roles].map((role) => [role.id, role]),
    );
    const roles = roleIdsInSnapshot
      ? roleIds.flatMap((roleId) => {
          const role = rolesById.get(roleId);
          return role ? [role] : [];
        })
      : [...rolesById.values()];

    return {
      ...game,
      script: {
        ...script,
        roles: mergeRoleCatalogMetadata(roles, roleCatalog),
      },
    };
  });
}

export function serializeStoredScript(
  script: StoredScript,
  roleCatalog: Role[] = [],
): SerializedStoredScript {
  return {
    ...script,
    roles: serializeScriptRoles(script.roles, roleCatalog),
  };
}

export function restoreStoredScript(
  script: SerializedStoredScript,
  roleCatalog: Role[] = [],
): StoredScript {
  return normalizeStoredScriptImages({
    ...script,
    roles: restoreScriptRoles(script.roles, roleCatalog),
  });
}

export function serializeScriptRoles(roles: Role[], roleCatalog: Role[] = []): SerializedRole[] {
  const catalogById = new Map(roleCatalog.map((role) => [role.id, role]));

  return roles.map((role) => {
    const catalogRole = catalogById.get(role.id);
    const isCanonicalOfficialRole =
      isOfficialRole(role) || (catalogRole !== undefined && isOfficialRole(catalogRole));

    if (
      (isCanonicalOfficialRole && !hasRoleOverrides(role, catalogRole)) ||
      isHydratedRoleReference(role)
    ) {
      return role.id;
    }

    return normalizeRoleImageUrls(role);
  });
}

export function restoreScriptRoles(roles: SerializedRole[], roleCatalog: Role[] = []): Role[] {
  return roles.map((serializedRole) => {
    const role =
      typeof serializedRole === 'string'
        ? { id: serializedRole, name: formatRoleId(serializedRole) }
        : isGeneratedRoleName(serializedRole)
          ? { ...serializedRole, name: formatRoleId(serializedRole.id) }
          : serializedRole;

    return mergeRoleCatalogMetadata([role], roleCatalog)[0];
  });
}

export function serializeGameScripts(games: Game[], roleCatalog: Role[] = []): SerializedGame[] {
  return games.map((game) => {
    if (!game.script) {
      return game;
    }

    if (game.script.id === SUSHI_BUFFET_SCRIPT_ID) {
      const { script: _script, ...gameWithoutScript } = game;

      return {
        ...gameWithoutScript,
        scriptId: game.scriptId ?? SUSHI_BUFFET_SCRIPT_ID,
        scriptRoleIds: game.script.roles.map((role) => role.id),
      };
    }

    return { ...game, script: serializeStoredScript(game.script, roleCatalog) };
  });
}

export function restoreGameScripts(games: SerializedGame[], roleCatalog: Role[] = []): Game[] {
  return games.map((game) =>
    game.script ? { ...game, script: restoreStoredScript(game.script, roleCatalog) } : game,
  ) as Game[];
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

function hasRoleOverrides(role: Role, catalogRole: Role | undefined) {
  if (role.notes?.length || !catalogRole) {
    return Boolean(role.notes?.length);
  }

  return (
    (!isGeneratedRoleName(role) && role.name !== catalogRole.name) ||
    (role.ability !== undefined && role.ability !== catalogRole.ability) ||
    (role.team !== undefined && role.team !== catalogRole.team) ||
    (role.edition !== undefined && role.edition !== catalogRole.edition)
  );
}

function isHydratedRoleReference(role: Role) {
  return (
    isGeneratedRoleName(role) && Object.keys(role).every((key) => key === 'id' || key === 'name')
  );
}
