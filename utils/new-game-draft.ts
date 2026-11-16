import 'expo-sqlite/localStorage/install';

import type { DraftPlayer } from '@/components/create/player-row';

const NEW_GAME_DRAFT_KEY = 'grim-keeper-new-game-draft';

export type NewGameDraft = {
  loricIds: string[];
  players: DraftPlayer[];
  scriptId: string | null;
  storytellerIds: string[];
};

// Kept outside the zustand stores and read synchronously so a reload (e.g. a mobile browser
// discarding the tab) restores the New Game form before the first render.
export function readNewGameDraft(): NewGameDraft | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(NEW_GAME_DRAFT_KEY);
    if (!raw) {
      return undefined;
    }

    const parsed = JSON.parse(raw) as Partial<NewGameDraft>;
    const players = Array.isArray(parsed.players)
      ? parsed.players.filter(
          (player): player is DraftPlayer =>
            typeof player?.id === 'string' && typeof player?.name === 'string',
        )
      : [];

    return {
      loricIds: toStringArray(parsed.loricIds),
      players,
      scriptId: typeof parsed.scriptId === 'string' ? parsed.scriptId : null,
      storytellerIds: toStringArray(parsed.storytellerIds),
    };
  } catch {
    return undefined;
  }
}

export function writeNewGameDraft(draft: NewGameDraft) {
  try {
    if (
      draft.players.length === 0 &&
      draft.storytellerIds.length === 0 &&
      draft.loricIds.length === 0 &&
      !draft.scriptId
    ) {
      clearNewGameDraft();
      return;
    }

    globalThis.localStorage?.setItem(NEW_GAME_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // The draft is a convenience; ignore storage failures.
  }
}

export function clearNewGameDraft() {
  try {
    globalThis.localStorage?.removeItem(NEW_GAME_DRAFT_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function toStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
