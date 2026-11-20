import { useEffect } from 'react';

import { getGoogleAccount, isGoogleSyncSupported } from '@/utils/google-auth';
import {
  cancelScheduledSync,
  scheduleSync,
  startWatchingChanges,
  syncNow,
} from '@/utils/sync-engine';

const POLL_MS = 2 * 60 * 1000;

/** Keeps this device in step with the Google Drive copy while the app is open. */
export function useAutoSync() {
  useEffect(() => {
    if (!isGoogleSyncSupported()) {
      return;
    }

    const syncIfSignedIn = () => {
      if (getGoogleAccount()) {
        void syncNow().catch(() => undefined);
      }
    };
    const handleVisible = () => {
      if (document.visibilityState === 'visible') {
        syncIfSignedIn();
      }
    };
    const stopWatching = startWatchingChanges(() => {
      if (getGoogleAccount()) {
        scheduleSync();
      }
    });
    const interval = setInterval(handleVisible, POLL_MS);
    document.addEventListener('visibilitychange', handleVisible);
    syncIfSignedIn();

    return () => {
      stopWatching();
      cancelScheduledSync();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, []);
}
