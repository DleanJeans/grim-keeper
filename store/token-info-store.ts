import 'expo-sqlite/localStorage/install';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { webStorage } from '@/utils/web-storage';

type TokenInfoState = {
  /** Show the friend's birth year (last two digits) on their map token. */
  showBirthYear: boolean;
  /** Show the friend's country flag on their map token. */
  showCountry: boolean;
  setShowBirthYear: (show: boolean) => void;
  setShowCountry: (show: boolean) => void;
};

/** Display-only settings for the personal info on map tokens; kept per device. */
export const useTokenInfoStore = create<TokenInfoState>()(
  persist(
    (set) => ({
      showBirthYear: false,
      showCountry: false,
      setShowBirthYear: (show) => set({ showBirthYear: show }),
      setShowCountry: (show) => set({ showCountry: show }),
    }),
    {
      name: 'grim-keeper-token-info-v1',
      version: 1,
      storage: createJSONStorage(() => (process.env.EXPO_OS === 'web' ? webStorage : localStorage)),
      partialize: (state) => ({
        showBirthYear: state.showBirthYear,
        showCountry: state.showCountry,
      }),
    },
  ),
);
