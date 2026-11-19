import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'grim-keeper-auto-nomination';
const listeners = new Set<() => void>();
let enabled = readStored();

/** Whether tapping the nominee on the map nominates right away, without Confirm Nomination. */
export function useAutoNomination() {
  return useSyncExternalStore(subscribe, getAutoNomination, getAutoNomination);
}

export function getAutoNomination() {
  return enabled;
}

export function setAutoNomination(next: boolean) {
  if (next === enabled) return;
  enabled = next;
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // Storage is optional: the choice still applies until the app restarts.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStored() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
