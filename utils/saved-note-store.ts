import type { Game, SavedNote, StoredScript } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

export function getNotesForPlayer(savedNotes: SavedNote[], playerName: string) {
  const playerKey = normalizePlayerName(playerName).toLocaleLowerCase();
  if (!playerKey) {
    return [];
  }
  return savedNotes
    .filter((note) => normalizePlayerName(note.playerName).toLocaleLowerCase() === playerKey)
    .slice()
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt));
}

export type LegacyFriendNote = {
  id: string;
  text: string;
  gameId?: string;
  scriptId?: string;
  day?: number;
  createdAt: string;
};

type MigrationFriend = { id: string; name: string; createdAt: string };

export type MigrationInput = {
  friends?: Array<MigrationFriend & { notes?: LegacyFriendNote[] }>;
  games?: Game[];
  savedNotes?: SavedNote[];
  scripts?: StoredScript[];
};

export function migrateV1ToV3(
  state: MigrationInput & {
    friends?: Array<MigrationFriend & { notes?: Array<string | LegacyFriendNote> }>;
  },
): MigrationInput {
  const afterV2: MigrationInput = {
    ...state,
    friends: (state.friends ?? []).map((friend) => {
      const legacyNotes = (friend as { notes?: Array<string | LegacyFriendNote> }).notes;
      if (!legacyNotes?.length) {
        return friend;
      }
      const normalized = legacyNotes
        .map((note) =>
          typeof note === 'string'
            ? { id: `friend-note-${Date.now()}`, text: note, createdAt: friend.createdAt }
            : note,
        )
        .filter((note): note is LegacyFriendNote => !!note?.text);
      return { ...friend, notes: normalized };
    }),
  };
  return migrateV2ToV3(afterV2);
}

export function resolveScriptName(
  state: { games?: Game[]; scripts?: StoredScript[] },
  scriptId: string | undefined,
  gameId: string | undefined,
): string {
  if (scriptId) {
    const fromGame = state.games?.find((game) => game.script?.id === scriptId)?.script?.name;
    if (fromGame) {
      return fromGame;
    }
    const fromScript = state.scripts?.find((script) => script.id === scriptId)?.name;
    if (fromScript) {
      return fromScript;
    }
  }
  if (gameId) {
    const fromGame = state.games?.find((game) => game.id === gameId)?.script?.name;
    if (fromGame) {
      return fromGame;
    }
  }
  return '';
}

export function migrateV2ToV3(state: MigrationInput): MigrationInput {
  const legacyFriends = (state.friends ?? []) as Array<
    MigrationFriend & { notes?: LegacyFriendNote[] }
  >;
  const seenIds = new Set((state.savedNotes ?? []).map((note) => note.id));
  const extraSavedNotes: SavedNote[] = [];
  const friends: MigrationFriend[] = legacyFriends.map((friend) => {
    if (!friend.notes?.length) {
      return friend;
    }
    for (const note of friend.notes) {
      if (!note?.text || seenIds.has(note.id)) {
        continue;
      }
      seenIds.add(note.id);
      extraSavedNotes.push({
        id: note.id,
        playerName: friend.name,
        roleIds: [],
        text: note.text,
        gameId: note.gameId ?? '',
        scriptId: note.scriptId,
        scriptName: resolveScriptName(state, note.scriptId, note.gameId),
        day: note.day ?? 1,
        createdAt: note.createdAt,
        updatedAt: note.createdAt,
      });
    }
    const { notes: _notes, ...rest } = friend;
    return rest;
  });
  return {
    ...state,
    friends,
    savedNotes: [...(state.savedNotes ?? []), ...extraSavedNotes],
  };
}

// Suppress an unused-type warning while keeping the type available for callers.
