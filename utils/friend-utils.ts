import type { Friend, FriendSummary, Game, SavedNote } from '@/types/game';
import { hasDuplicatePlayerName, normalizePlayerName } from '@/utils/conversation-utils';
import { APP_USER_ID, createFriendId } from '@/utils/object-id';
import { getNotesForPlayer } from '@/utils/saved-note-store';

export function getFriendSummaries(
  games: Game[],
  friends: Friend[],
  excludedName?: string,
): FriendSummary[] {
  const summaries = new Map<string, FriendSummary>();
  const excludedKey = normalizePlayerName(excludedName ?? '').toLocaleLowerCase();

  for (const friend of friends) {
    const name = normalizePlayerName(friend.name);
    const key = name.toLocaleLowerCase();

    if (name && key !== excludedKey) {
      summaries.set(key, { ...friend, name, gamesPlayed: 0, gamesStorytold: 0 });
    }
  }

  for (const game of games) {
    const gameFriendKeys = new Set<string>();
    const gameStorytellerKeys = new Set<string>();

    for (const player of game.players) {
      const name = normalizePlayerName(player.name);

      if (!name) {
        continue;
      }

      const key = name.toLocaleLowerCase();

      if (player.id === APP_USER_ID || key === excludedKey) {
        continue;
      }

      gameFriendKeys.add(key);
      if (player.isStoryteller) {
        gameStorytellerKeys.add(key);
      }

      if (!summaries.has(key)) {
        summaries.set(key, {
          id: createFriendId(
            name,
            [...summaries.values()].map((friend) => friend.id),
          ),
          name,
          createdAt: game.createdAt,
          gamesPlayed: 0,
          gamesStorytold: 0,
        });
      }
    }

    for (const key of gameFriendKeys) {
      const summary = summaries.get(key);

      if (summary) {
        summary.gamesPlayed += 1;
      }
    }

    for (const key of gameStorytellerKeys) {
      const summary = summaries.get(key);

      if (summary) {
        summary.gamesStorytold += 1;
      }
    }
  }

  return [...summaries.values()].sort((first, second) =>
    first.name.localeCompare(second.name, undefined, { sensitivity: 'base' }),
  );
}

export function sortFriendSummaries(friends: FriendSummary[], savedNotes: SavedNote[]) {
  return [...friends].sort((first, second) => {
    const gamesDifference = second.gamesPlayed - first.gamesPlayed;
    if (gamesDifference) {
      return gamesDifference;
    }

    const notesDifference =
      getNotesForPlayer(savedNotes, second.name).length -
      getNotesForPlayer(savedNotes, first.name).length;
    return (
      notesDifference || first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
    );
  });
}

export function sortStorytellerSummaries(friends: FriendSummary[]) {
  return [...friends].sort((first, second) => {
    const gamesDifference = second.gamesStorytold - first.gamesStorytold;

    return (
      gamesDifference || first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })
    );
  });
}

/**
 * The friend each seated player is, matched by id or, for players typed in by name or carried
 * over from a saved game, by name.
 */
export function getPlayerFriend(player: Pick<Friend, 'id' | 'name'>, friends: FriendSummary[]) {
  return friends.find((friend) => friend.id === player.id) ?? getFriendByName(friends, player.name);
}

/** Ids of the friends who already sit among the players, in seat order. */
export function getSelectedFriendIds(
  players: Array<Pick<Friend, 'id' | 'name'>>,
  friends: FriendSummary[],
) {
  return [...new Set(players.flatMap((player) => getPlayerFriend(player, friends)?.id ?? []))];
}

/**
 * Players typed in on the New Game screen who aren't friends yet, as picker entries, so the
 * Choose friends picker shows every seated player.
 */
export function getUnsavedPlayerFriends(
  players: Array<Pick<Friend, 'id' | 'name'>>,
  friends: FriendSummary[],
): FriendSummary[] {
  return players.flatMap((player) =>
    getPlayerFriend(player, friends)
      ? []
      : [{ createdAt: '', gamesPlayed: 0, gamesStorytold: 0, id: player.id, name: player.name }],
  );
}

export function mergeFriendPlayerSelection(
  currentPlayers: Array<Pick<Friend, 'id' | 'name'>>,
  friends: FriendSummary[],
  selectedFriendIds: string[],
) {
  const selectedFriendIdSet = new Set(selectedFriendIds);
  const friendsById = new Map(friends.map((friend) => [friend.id, friend]));
  // A player stays unless they are a friend the picker left unselected.
  const retainedPlayers = currentPlayers.filter((player) => {
    const friend = getPlayerFriend(player, friends);
    return !friend || selectedFriendIdSet.has(friend.id);
  });
  const retainedPlayerIds = new Set(retainedPlayers.map((player) => player.id));
  const retainedNames = retainedPlayers.map((player) => player.name);
  const addedPlayers = selectedFriendIds.flatMap((friendId) => {
    const friend = friendsById.get(friendId);

    if (
      !friend ||
      retainedPlayerIds.has(friend.id) ||
      hasDuplicatePlayerName(retainedNames, friend.name)
    ) {
      return [];
    }

    const player = { id: friend.id, name: normalizePlayerName(friend.name) };
    retainedPlayerIds.add(player.id);
    retainedNames.push(player.name);
    return [player];
  });

  return [...retainedPlayers, ...addedPlayers];
}

export function hasFriendName(friends: FriendSummary[], name: string) {
  return !!getFriendByName(friends, name);
}

export function getFriendByName<T extends Friend>(friends: T[], name: string) {
  const normalizedName = normalizePlayerName(name).toLocaleLowerCase();

  return friends.find(
    (friend) =>
      !!normalizedName && normalizePlayerName(friend.name).toLocaleLowerCase() === normalizedName,
  );
}

export function addMissingFriends(friends: Friend[], names: string[], createdAt: string) {
  const friendKeys = new Set(
    friends.map((friend) => normalizePlayerName(friend.name).toLocaleLowerCase()),
  );
  const nextFriends = [...friends];

  for (const name of names) {
    const normalizedName = normalizePlayerName(name);
    const key = normalizedName.toLocaleLowerCase();

    if (key && !friendKeys.has(key)) {
      friendKeys.add(key);
      nextFriends.push({
        id: createFriendId(
          normalizedName,
          nextFriends.map((friend) => friend.id),
        ),
        name: normalizedName,
        createdAt,
      });
    }
  }

  return nextFriends;
}
