import type { Friend, Game, SavedNote, StoredScript } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

const OFFICIAL_SCRIPT_AUTHOR = 'The Pandemonium Institute';

export function createGameId(scriptName: string | undefined, createdAt: string, usedIds: string[]) {
  return makeUniqueId(`${slugify(scriptName || 'game')}-${formatIdDate(createdAt)}`, usedIds);
}

export function createConversationId(createdAt: string, usedIds: string[]) {
  return makeUniqueId(`conversation-${formatIdDate(createdAt, 14)}`, usedIds);
}

export function mapGameConversationIds(game: Game): Game {
  const usedIds: string[] = [];
  const conversations = game.conversations.map((conversation) => {
    const id = createConversationId(conversation.createdAt, usedIds);
    usedIds.push(id);
    return { ...conversation, id };
  });

  return { ...game, conversations };
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

export function getRoleIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === 'string') {
      return [item];
    }

    if (item && typeof item === 'object' && typeof (item as { id?: unknown }).id === 'string') {
      return [(item as { id: string }).id];
    }

    return [];
  });
}

export function addMissingFriendsForGames(
  friends: Friend[],
  games: Game[],
  appUserName?: string,
): Friend[] {
  const nextFriends = [...friends];
  const friendNames = new Set(
    nextFriends.map((friend) => normalizePlayerName(friend.name).toLocaleLowerCase()),
  );
  const appUserKey = normalizePlayerName(appUserName ?? '').toLocaleLowerCase();

  for (const game of games) {
    for (const player of game.players) {
      const name = normalizePlayerName(player.name);
      const nameKey = name.toLocaleLowerCase();

      if (!name || player.isAppUser || nameKey === appUserKey || friendNames.has(nameKey)) {
        continue;
      }

      friendNames.add(nameKey);
      nextFriends.push({
        id: createFriendId(
          name,
          nextFriends.map((friend) => friend.id),
        ),
        name,
        createdAt: game.createdAt,
      });
    }
  }

  return nextFriends;
}

export function mapGamePlayerIdsToFriendIds(
  game: Game,
  friends: Friend[],
  appUserName?: string,
): Game {
  const friendIdsByName = new Map<string, string>();
  const duplicateFriendNames = new Set<string>();

  for (const friend of friends) {
    const nameKey = normalizePlayerName(friend.name).toLocaleLowerCase();

    if (!nameKey) {
      continue;
    }

    if (friendIdsByName.has(nameKey)) {
      duplicateFriendNames.add(nameKey);
      continue;
    }

    friendIdsByName.set(nameKey, friend.id);
  }

  const playerIds = new Set(game.players.map((player) => player.id));
  const candidateCounts = new Map<string, number>();
  const candidates = new Map<string, string>();
  const appUserKey = normalizePlayerName(appUserName ?? '').toLocaleLowerCase();

  for (const player of game.players) {
    if (player.isAppUser || normalizePlayerName(player.name).toLocaleLowerCase() === appUserKey) {
      continue;
    }

    const nameKey = normalizePlayerName(player.name).toLocaleLowerCase();
    const friendId = friendIdsByName.get(nameKey);

    if (
      !friendId ||
      duplicateFriendNames.has(nameKey) ||
      (friendId !== player.id && playerIds.has(friendId))
    ) {
      continue;
    }

    candidates.set(player.id, friendId);
    candidateCounts.set(friendId, (candidateCounts.get(friendId) ?? 0) + 1);
  }

  const playerIdMap = new Map(
    [...candidates].filter(([, friendId]) => candidateCounts.get(friendId) === 1),
  );

  if (playerIdMap.size === 0) {
    return game;
  }

  const mapPlayerId = (playerId: string) => playerIdMap.get(playerId) ?? playerId;

  return {
    ...game,
    players: game.players.map((player) => ({
      ...player,
      id: mapPlayerId(player.id),
      death: player.death
        ? {
            ...player.death,
            ...(player.death.killerPlayerId !== undefined
              ? { killerPlayerId: mapPlayerId(player.death.killerPlayerId) }
              : {}),
            ...(player.death.killerPlayerIds
              ? { killerPlayerIds: player.death.killerPlayerIds.map(mapPlayerId) }
              : {}),
          }
        : undefined,
      roleAssignments: player.roleAssignments?.map((assignment) => ({
        ...assignment,
        ...(assignment.subjectPlayerId !== undefined
          ? { subjectPlayerId: mapPlayerId(assignment.subjectPlayerId) }
          : {}),
      })),
    })),
    conversations: game.conversations.map((conversation) => ({
      ...conversation,
      bigWigPlayerId:
        conversation.bigWigPlayerId !== undefined
          ? mapPlayerId(conversation.bigWigPlayerId)
          : undefined,
      initiatorId: mapPlayerId(conversation.initiatorId),
      participantIds: conversation.participantIds.map(mapPlayerId),
      voterIds: conversation.voterIds?.map(mapPlayerId),
    })),
    playerDayNotes: game.playerDayNotes?.map((entry) => ({
      ...entry,
      playerId: mapPlayerId(entry.playerId),
    })),
  };
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
  const normalizedFriends = state.friends?.map((friend) => {
    const id = createFriendId(friend.name, usedFriendIds);
    usedFriendIds.push(id);
    return { ...friend, id };
  });
  const friends = normalizedFriends
    ? addMissingFriendsForGames(normalizedFriends, state.games ?? [], state.appUserName)
    : undefined;
  const scripts = state.scripts?.map((script) => ({
    ...script,
    id: scriptIds.get(script.id) ?? script.id,
  }));
  const games = state.games?.map((game) =>
    mapGameConversationIds(
      mapGamePlayerIdsToFriendIds(
        {
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
          lorics: game.lorics ? getRoleIds(game.lorics) : undefined,
          scriptRoleOverrides: game.scriptRoleOverrides
            ? getRoleIds(game.scriptRoleOverrides)
            : undefined,
        },
        friends ?? [],
        state.appUserName,
      ),
    ),
  );
  const savedNotes = state.savedNotes?.map((note) => ({
    ...note,
    gameId: gameIds.get(note.gameId) ?? note.gameId,
    scriptId: note.scriptId ? (scriptIds.get(note.scriptId) ?? note.scriptId) : undefined,
  }));

  return { ...state, friends, games, savedNotes, scripts };
}

type GameDataShape = {
  appUserName?: string;
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

function formatIdDate(value: string, length = 12) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace(/\D/g, '').slice(0, length) || 'unknown-date';
  }

  return date.toISOString().replace(/[-:T]/g, '').slice(0, length);
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
