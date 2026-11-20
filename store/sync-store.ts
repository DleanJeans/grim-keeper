import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SyncBase } from '@/utils/sync-merge';
import { webStorage } from '@/utils/web-storage';

export type SyncStatus = 'error' | 'idle' | 'syncing';

type SyncState = {
  /** What the last sync saw; tells deleted records from new ones. */
  base?: SyncBase;
  /** This device changed since the last sync. */
  dirty: boolean;
  error?: string;
  status: SyncStatus;
  setBase: (base: SyncBase | undefined) => void;
  setDirty: (dirty: boolean) => void;
  setStatus: (status: SyncStatus, error?: string) => void;
};

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      base: undefined,
      dirty: true,
      error: undefined,
      status: 'idle',
      setBase: (base) => set({ base }),
      setDirty: (dirty) => set({ dirty }),
      setStatus: (status, error) => set({ error, status }),
    }),
    {
      name: 'grim-keeper-sync-v1',
      partialize: (state) => ({ base: state.base, dirty: state.dirty }),
      storage: createJSONStorage(() => webStorage),
    },
  ),
);
