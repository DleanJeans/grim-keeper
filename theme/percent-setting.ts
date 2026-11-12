import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

type PercentRange = { default: number; max: number; min: number; step: number };

/**
 * A percentage picked with a slider in Settings, kept in localStorage outside the zustand stores
 * so the first render can read it. Components that read it re-render when it changes.
 */
export function createPercentSetting(storageKey: string, range: PercentRange) {
  let percent = readStoredPercent();
  const listeners = new Set<() => void>();

  function getPercent() {
    return percent;
  }

  function setPercent(next: number) {
    const clamped = clampPercent(next);
    if (clamped === percent) return;
    percent = clamped;
    try {
      globalThis.localStorage?.setItem(storageKey, String(clamped));
    } catch {
      // Storage is optional: the value still applies until the app restarts.
    }
    for (const listener of listeners) listener();
  }

  /** The multiplier, such as 0.8 for 80%. */
  function useMultiplier() {
    return useSyncExternalStore(subscribe, getPercent, getPercent) / 100;
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  function readStoredPercent() {
    try {
      const stored = Number(globalThis.localStorage?.getItem(storageKey));
      return stored ? clampPercent(stored) : range.default;
    } catch {
      return range.default;
    }
  }

  function clampPercent(value: number) {
    if (!Number.isFinite(value)) return range.default;
    return Math.min(range.max, Math.max(range.min, Math.round(value / range.step) * range.step));
  }

  return { getPercent, setPercent, useMultiplier };
}
