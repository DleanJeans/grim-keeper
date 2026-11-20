import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { useSyncStore } from '@/store/sync-store';
import { type BackupGameData, createBackup, parseBackup } from '@/utils/data-transfer';
import { readSyncFile, writeSyncFile } from '@/utils/drive-sync';
import { getGoogleAccessToken } from '@/utils/google-auth';
import { getSyncBase, mergeSyncData } from '@/utils/sync-merge';

const DEBOUNCE_MS = 4000;

let running: Promise<void> | undefined;
let applying = false;
let changeCount = 0;
let timer: ReturnType<typeof setTimeout> | undefined;

export function readLocalData(): BackupGameData {
  const state = useGameStore.getState();
  return {
    appUserName: state.appUserName,
    defaultStartingNight: state.defaultStartingNight,
    dj: useDjStore.getState(),
    friends: state.friends,
    games: state.games,
    roleCatalog: state.roleCatalog,
    savedNotes: state.savedNotes,
    scripts: state.scripts,
  };
}

/** Marks the device as changed and syncs shortly after the last change. */
export function startWatchingChanges(onChange: () => void) {
  const handleChange = () => {
    if (applying) {
      return;
    }

    changeCount += 1;
    useSyncStore.getState().setDirty(true);
    onChange();
  };
  const unsubscribeGame = useGameStore.subscribe(handleChange);
  const unsubscribeDj = useDjStore.subscribe(handleChange);

  return () => {
    unsubscribeGame();
    unsubscribeDj();
  };
}

export function scheduleSync() {
  clearTimeout(timer);
  timer = setTimeout(() => {
    void syncNow().catch(() => undefined);
  }, DEBOUNCE_MS);
}

export function cancelScheduledSync() {
  clearTimeout(timer);
}

/** Pulls the Drive copy, merges it with this device and uploads the result when it differs. */
export function syncNow(): Promise<void> {
  running ??= runSync().finally(() => {
    running = undefined;
  });
  return running;
}

function waitForSyncStore() {
  if (useSyncStore.persist.hasHydrated()) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const unsubscribe = useSyncStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

async function runSync() {
  await waitForSyncStore();
  const syncStore = useSyncStore.getState();
  syncStore.setStatus('syncing');

  try {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      syncStore.setStatus('idle');
      return;
    }

    const changesAtStart = changeCount;
    const local = readLocalData();
    const file = await readSyncFile(accessToken);
    const remote = file ? parseBackup(file.text) : undefined;
    const merged = remote
      ? mergeSyncData({
          base: syncStore.base,
          local,
          localChanged: syncStore.dirty || !syncStore.base,
          remote,
        })
      : local;

    if (remote && fingerprint(merged) !== fingerprint(local)) {
      const { dj, ...gameData } = merged;
      applying = true;
      try {
        useGameStore.getState().importData(gameData);
        useDjStore.getState().importData(dj);
      } finally {
        applying = false;
      }
    }

    if (!remote || fingerprint(merged) !== fingerprint(remote)) {
      await writeSyncFile(accessToken, createBackup(merged), file?.id);
    }

    const stillSame = changeCount === changesAtStart;
    useSyncStore.getState().setBase(getSyncBase(merged, new Date().toISOString()));
    useSyncStore.getState().setDirty(!stillSame);
    useSyncStore.getState().setStatus('idle');
    if (!stillSame) {
      scheduleSync();
    }
  } catch (error) {
    useSyncStore
      .getState()
      .setStatus('error', error instanceof Error ? error.message : 'Sync failed.');
    throw error;
  }
}

function fingerprint(data: BackupGameData) {
  const { exportedAt: _exportedAt, ...backup } = JSON.parse(createBackup(data)) as {
    exportedAt: string;
  };
  return JSON.stringify(backup);
}
