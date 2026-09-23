import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { DjData, DjSessionSong, DjTarget } from '@/types/dj';
import {
  addDjSong,
  adjustDjApproval,
  createEmptyDjData,
  recordDjPlayed,
  remapDjFriendTarget,
  remapDjSessionGameId,
  removeDjSong,
  restoreDjData,
  serializeDjData,
} from '@/utils/dj-utils';
import { webStorage } from '@/utils/web-storage';

type DjState = DjData & {
  addSong: (target: DjTarget, songUrl: string) => void;
  adjustApproval: (gameId: string, songUrl: string, delta: number) => void;
  clearData: () => void;
  importData: (data?: DjData) => void;
  importSession: (sessions: DjSessionSong[] | undefined, gameId: string) => void;
  recordPlayed: (gameId: string, songUrl: string) => void;
  remapFriendTarget: (oldId: string, newId: string) => void;
  removeSong: (target: DjTarget, songUrl: string) => void;
  setEnabled: (enabled: boolean) => void;
};

const emptyDjData = createEmptyDjData();

export const useDjStore = create<DjState>()(
  persist(
    (set) => ({
      ...emptyDjData,
      addSong: (target, songUrl) =>
        set((state) => ({ playlists: addDjSong(state.playlists, target, songUrl) })),
      adjustApproval: (gameId, songUrl, delta) =>
        set((state) => ({ sessions: adjustDjApproval(state.sessions, gameId, songUrl, delta) })),
      clearData: () => set(createEmptyDjData()),
      importData: (data) => set(restoreDjData(data)),
      importSession: (sessions, gameId) => {
        if (!sessions?.length) {
          return;
        }

        set((state) => {
          let nextSessions = [...state.sessions];
          for (const session of remapDjSessionGameId(sessions, sessions[0].gameId, gameId)) {
            nextSessions = mergeImportedSession(nextSessions, session);
          }
          return { sessions: nextSessions };
        });
      },
      recordPlayed: (gameId, songUrl) =>
        set((state) => ({ sessions: recordDjPlayed(state.sessions, gameId, songUrl) })),
      remapFriendTarget: (oldId, newId) =>
        set((state) => ({ playlists: remapDjFriendTarget(state.playlists, oldId, newId) })),
      removeSong: (target, songUrl) =>
        set((state) => ({ playlists: removeDjSong(state.playlists, target, songUrl) })),
      setEnabled: (enabled) => set({ enabled }),
    }),
    {
      name: 'grim-keeper-dj-store-v1',
      version: 1,
      storage: createJSONStorage(() => (process.env.EXPO_OS === 'web' ? webStorage : localStorage)),
      migrate: (persistedState) => restoreDjData(persistedState),
      partialize: (state) => serializeDjData(state) ?? emptyDjData,
    },
  ),
);

function mergeImportedSession(sessions: DjSessionSong[], imported: DjSessionSong) {
  const existing = sessions.find(
    (session) => session.gameId === imported.gameId && session.songUrl === imported.songUrl,
  );
  if (!existing) {
    return [...sessions, imported];
  }

  return sessions.map((session) =>
    session === existing
      ? {
          ...session,
          approvalScore: session.approvalScore + imported.approvalScore,
          playedCount: session.playedCount + imported.playedCount,
        }
      : session,
  );
}
