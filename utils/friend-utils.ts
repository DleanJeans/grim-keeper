import type { Friend, FriendSummary, Game } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

export function getFriendSummaries(games: Game[], friends: Friend[]): FriendSummary[] {
  const summaries = new Map<string, FriendSummary>();

  for (const friend of friends) {
    const name = normalizePlayerName(friend.name);

    if (name) {
      summaries.set(name.toLocaleLowerCase(), { ...friend, name, gamesPlayed: 0 });
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
      gameFriendKeys.add(key);

      if (!summaries.has(key)) {
        summaries.set(key, {
          id: `friend-${key}`,
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

export function hasFriendName(friends: FriendSummary[], name: string) {
  const normalizedName = normalizePlayerName(name).toLocaleLowerCase();

  return (
    !!normalizedName && friends.some((friend) => friend.name.toLocaleLowerCase() === normalizedName)
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
        id: createFriendId(),
        name: normalizedName,
        createdAt,
      });
    }
  }

  return nextFriends;
}

function createFriendId() {
  return `friend-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
