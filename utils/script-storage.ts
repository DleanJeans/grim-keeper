import type { Game, Role, StoredScript } from '@/types/game';

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

function stripRoleImages(role: Role): Role {
  const { imageUrl, imageUrls, ...roleWithoutImages } = role;
  const remainingImageUrl = isDataImageUrl(imageUrl) ? undefined : imageUrl;
  const remainingImageUrls = imageUrls?.filter((image) => !isDataImageUrl(image));

  return {
    ...roleWithoutImages,
    ...(remainingImageUrl ? { imageUrl: remainingImageUrl } : {}),
    ...(remainingImageUrls?.length ? { imageUrls: remainingImageUrls } : {}),
  };
}

function getRoleImages(role: Role) {
  return {
    ...(role.imageUrl ? { imageUrl: role.imageUrl } : {}),
    ...(role.imageUrls?.length ? { imageUrls: role.imageUrls } : {}),
  };
}

function isDataImageUrl(value: string | undefined) {
  return value?.startsWith('data:image/') ?? false;
}
