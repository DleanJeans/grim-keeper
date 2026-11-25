import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { webStorage } from '@/utils/web-storage';

export const PRIVATE_MESSAGE_FONT_SIZE = { default: 28, max: 56, min: 16, step: 2 } as const;

export type SavedPrivateMessage = { id: string; text: string };

type PrivateMessageState = {
  /** What is in the message box, kept so closing the screen does not lose it. */
  draft: string;
  /** Reading size of the message on the hand-over screen. */
  fontSize: number;
  saved: SavedPrivateMessage[];
  deleteSaved: (id: string) => void;
  /** Saves the text unless the same text is already saved. */
  save: (text: string) => void;
  setDraft: (draft: string) => void;
  setFontSize: (fontSize: number) => void;
};

/** Messages the Storyteller shows privately to a player; kept per device. */
export const usePrivateMessageStore = create<PrivateMessageState>()(
  persist(
    (set) => ({
      draft: '',
      fontSize: PRIVATE_MESSAGE_FONT_SIZE.default,
      saved: [],
      deleteSaved: (id) =>
        set((state) => ({ saved: state.saved.filter((item) => item.id !== id) })),
      save: (text) =>
        set((state) => {
          const trimmed = text.trim();
          if (!trimmed || state.saved.some((item) => item.text.trim() === trimmed)) {
            return state;
          }
          const id = `pm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
          return { saved: [{ id, text: trimmed }, ...state.saved] };
        }),
      setDraft: (draft) => set({ draft }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'grim-keeper-private-messages-v1',
      version: 1,
      storage: createJSONStorage(() => (process.env.EXPO_OS === 'web' ? webStorage : localStorage)),
      partialize: (state) => ({
        draft: state.draft,
        fontSize: state.fontSize,
        saved: state.saved,
      }),
    },
  ),
);
