import type { Friend, Game, SavedNote, StoredScript } from '@/types/game';

const OFFICIAL_SCRIPT_AUTHOR = 'The Pandemonium Institute';

export function createGameId(scriptName: string | undefined, createdAt: string, usedIds: string[]) {
  return makeUniqueId(`${slugify(scriptName || 'game')}-${formatIdDate(createdAt)}`, usedIds);
}

export function createFriendId(name: string, usedIds: string[]) {
  return makeUniqueId(slugify(name) || 'friend', usedIds);
}

export function createScriptId(
  script: Pick<StoredScript, 'author' | 'name' | 'remoteId'>,
  usedIds: string[],
) {
  const name = slugify(script.name) || 'script';
  const baseId =
    script.remoteId !== undefined && script.author !== OFFICIAL_SCRIPT_AUTHOR
      ? `${script.remoteId}-${name}`
      : name;

  return makeUniqueId(baseId, usedIds);
}

export function migrateObjectIds(state: Partial<GameDataShape>): Partial<GameDataShape> {
  const scriptIds = new Map<string, string>();
  const usedScriptIds: string[] = [];
  const allScripts = [
    ...(state.scripts ?? []),
    ...(state.games ?? []).flatMap((game) => (game.script ? [game.script] : [])),
  ];

  for (const script of allScripts) {
    if (!scriptIds.has(script.id)) {
      const nextId = createScriptId(script, usedScriptIds);
      scriptIds.set(script.id, nextId);
      usedScriptIds.push(nextId);
    }
  }

  const gameIds = new Map<string, string>();
  const usedGameIds: string[] = [];
  for (const game of state.games ?? []) {
    const nextId =
      !game.script && game.scriptId !== undefined
        ? game.id
        : createGameId(game.script?.name, game.createdAt, usedGameIds);
    gameIds.set(game.id, nextId);
    usedGameIds.push(nextId);
  }

  const usedFriendIds: string[] = [];
  const friends = state.friends?.map((friend) => {
    const id = createFriendId(friend.name, usedFriendIds);
    usedFriendIds.push(id);
    return { ...friend, id };
  });
  const scripts = state.scripts?.map((script) => ({
    ...script,
    id: scriptIds.get(script.id) ?? script.id,
  }));
  const games = state.games?.map((game) => ({
    ...game,
    id: gameIds.get(game.id) ?? game.id,
    scriptId: game.scriptId
      ? (scriptIds.get(game.scriptId) ?? game.scriptId)
      : game.script
        ? (scriptIds.get(game.script.id) ?? game.script.id)
        : undefined,
    script: game.script
      ? { ...game.script, id: scriptIds.get(game.script.id) ?? game.script.id }
      : undefined,
  }));
  const savedNotes = state.savedNotes?.map((note) => ({
    ...note,
    gameId: gameIds.get(note.gameId) ?? note.gameId,
    scriptId: note.scriptId ? (scriptIds.get(note.scriptId) ?? note.scriptId) : undefined,
  }));

  return { ...state, friends, games, savedNotes, scripts };
}

type GameDataShape = {
  friends: Friend[];
  games: Game[];
  savedNotes: SavedNote[];
  scripts: StoredScript[];
};

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatIdDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace(/\D/g, '').slice(0, 12) || 'unknown-date';
  }

  return date.toISOString().replace(/[-:T]/g, '').slice(0, 12);
}

function makeUniqueId(baseId: string, usedIds: string[]) {
  const used = new Set(usedIds);
  if (!used.has(baseId)) {
    return baseId;
  }

  let suffix = 2;
  while (used.has(`${baseId}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseId}-${suffix}`;
}
