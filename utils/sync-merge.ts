import type { Friend } from '@/types/game';
import type { BackupGameData } from '@/utils/data-transfer';
import { addMissingFriendsForGames } from '@/utils/object-id';

/** What the last successful sync saw, so a missing record can be told apart from a new one. */
export type SyncBase = {
  friendIds: string[];
  gameIds: string[];
  noteIds: string[];
  scriptIds: string[];
  syncedAt: string;
};

type MergeInput = {
  base?: SyncBase;
  /** Whether this device changed anything since the last sync. */
  localChanged: boolean;
  local: BackupGameData;
  remote: BackupGameData;
};

type Stamped = { id: string; updatedAt: string };

export function getSyncBase(data: BackupGameData, syncedAt: string): SyncBase {
  return {
    friendIds: data.friends.map((friend) => friend.id),
    gameIds: data.games.map((game) => game.id),
    noteIds: data.savedNotes.map((note) => note.id),
    scriptIds: data.scripts.map((script) => script.id),
    syncedAt,
  };
}

/**
 * Merges this device's data with the synced copy, record by record. The newer record wins,
 * a record deleted on one side stays deleted unless the other side edited it after the last
 * sync, and anything new on either side is kept. Nothing is dropped without a trace in `base`.
 */
export function mergeSyncData({ base, local, localChanged, remote }: MergeInput): BackupGameData {
  const games = mergeStamped(local.games, remote.games, base?.gameIds, base?.syncedAt);
  const friends = mergeFriends(local.friends, remote.friends, base?.friendIds);
  const mergedFriends: Friend[] = addMissingFriendsForGames(
    friends,
    games,
    localChanged ? local.appUserName : remote.appUserName,
  );
  const dj = localChanged ? (local.dj ?? remote.dj) : (remote.dj ?? local.dj);

  return {
    appUserName: localChanged ? local.appUserName : remote.appUserName,
    defaultStartingNight: localChanged
      ? local.defaultStartingNight
      : (remote.defaultStartingNight ?? local.defaultStartingNight),
    friends: mergedFriends,
    games,
    roleCatalog: mergeById(local.roleCatalog, remote.roleCatalog),
    savedNotes: mergeStamped(local.savedNotes, remote.savedNotes, base?.noteIds, base?.syncedAt),
    scripts: mergeStamped(local.scripts, remote.scripts, base?.scriptIds, base?.syncedAt),
    ...(dj ? { dj } : {}),
  };
}

function mergeStamped<T extends Stamped>(
  local: T[],
  remote: T[],
  baseIds: string[] | undefined,
  syncedAt: string | undefined,
): T[] {
  const inBase = new Set(baseIds ?? []);
  const remoteById = new Map(remote.map((item) => [item.id, item]));
  const localIds = new Set(local.map((item) => item.id));
  const result: T[] = [];

  for (const item of local) {
    const other = remoteById.get(item.id);

    if (other) {
      result.push(isNewer(other.updatedAt, item.updatedAt) ? other : item);
    } else if (!inBase.has(item.id) || editedAfter(item.updatedAt, syncedAt)) {
      // New here, or deleted elsewhere but edited here since the last sync.
      result.push(item);
    }
  }

  for (const item of remote) {
    if (localIds.has(item.id)) {
      continue;
    }

    if (!inBase.has(item.id) || editedAfter(item.updatedAt, syncedAt)) {
      result.push(item);
    }
  }

  return result;
}

function mergeFriends(local: Friend[], remote: Friend[], baseIds: string[] | undefined) {
  const inBase = new Set(baseIds ?? []);
  const remoteById = new Map(remote.map((friend) => [friend.id, friend]));
  const localIds = new Set(local.map((friend) => friend.id));
  const result = local
    .filter((friend) => remoteById.has(friend.id) || !inBase.has(friend.id))
    .map((friend) => {
      const other = remoteById.get(friend.id);
      return other && !friend.picture && other.picture
        ? { ...friend, picture: other.picture }
        : friend;
    });

  for (const friend of remote) {
    if (!localIds.has(friend.id) && !inBase.has(friend.id)) {
      result.push(friend);
    }
  }

  return result;
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]) {
  const ids = new Set(local.map((item) => item.id));
  return [...local, ...remote.filter((item) => !ids.has(item.id))];
}

function isNewer(candidate: string, current: string) {
  return Date.parse(candidate) > Date.parse(current);
}

function editedAfter(updatedAt: string, syncedAt: string | undefined) {
  return !syncedAt || Date.parse(updatedAt) > Date.parse(syncedAt);
}
