import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

/** Sizes as a percentage of the default, picked with the sliders in Settings. */
export const SCALE_PERCENT = { default: 100, max: 120, min: 70, step: 5 } as const;

type ScaleSetting = {
  get: () => number;
  set: (percent: number) => void;
  subscribe: (listener: () => void) => () => void;
};

// Kept outside the zustand stores, like the theme: the first render must already use them.
const fontScale = createScaleSetting('grim-keeper-font-scale');
const uiScale = createScaleSetting('grim-keeper-ui-scale');

export const setFontScalePercent = fontScale.set;
export const setUiScalePercent = uiScale.set;

/** The text size multiplier; text re-renders when it changes. */
export function useFontScale() {
  return useScale(fontScale);
}

/** The multiplier for the whole UI (layout, icons and text). */
export function useUiScale() {
  return useScale(uiScale);
}

export function getUiScale() {
  return uiScale.get() / 100;
}

function useScale(setting: ScaleSetting) {
  return useSyncExternalStore(setting.subscribe, setting.get, setting.get) / 100;
}

function createScaleSetting(storageKey: string): ScaleSetting {
  let percent = readStoredPercent(storageKey);
  const listeners = new Set<() => void>();

  return {
    get: () => percent,
    set: (next) => {
      const clamped = clampPercent(next);
      if (clamped === percent) return;
      percent = clamped;
      try {
        globalThis.localStorage?.setItem(storageKey, String(clamped));
      } catch {
        // Storage is optional: the size still applies until the app restarts.
      }
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

function readStoredPercent(storageKey: string) {
  try {
    const stored = Number(globalThis.localStorage?.getItem(storageKey));
    return stored ? clampPercent(stored) : SCALE_PERCENT.default;
  } catch {
    return SCALE_PERCENT.default;
  }
}

function clampPercent(percent: number) {
  const { default: fallback, max, min, step } = SCALE_PERCENT;
  if (!Number.isFinite(percent)) return fallback;
  return Math.min(max, Math.max(min, Math.round(percent / step) * step));
}
