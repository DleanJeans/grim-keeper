import { useAutoSync } from '@/hooks/use-auto-sync';

/** Runs Google Drive auto sync for the whole app. */
export function AutoSync() {
  useAutoSync();
  return null;
}
