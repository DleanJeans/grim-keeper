import type { Friend, FriendSummary, Game, SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
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
      summaries.set(key, { ...friend, name, gamesPlayed: 0 });
    }
  }

  for (const game of games) {
    const gameFriendKeys = new Set<string>();

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

      if (!summaries.has(key)) {
        summaries.set(key, {
          id: createFriendId(
            name,
            [...summaries.values()].map((friend) => friend.id),
          ),
          name,
          createdAt: game.createdAt,
          gamesPlayed: 0,
        });
      }
    }

    for (const key of gameFriendKeys) {
      const summary = summaries.get(key);

      if (summary) {
        summary.gamesPlayed += 1;
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
