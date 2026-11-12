import 'expo-sqlite/localStorage/install';
import { useSyncExternalStore } from 'react';

// Kept outside the zustand stores, like the theme: text must read it on the first render.
const FONT_SCALE_STORAGE_KEY = 'grim-keeper-font-scale';

/** Font size as a percentage of the default, picked with the slider in Settings. */
export const FONT_SCALE_PERCENT = { default: 100, max: 120, min: 70, step: 5 } as const;

let fontScalePercent = readStoredFontScalePercent();
const listeners = new Set<() => void>();

export function getFontScalePercent() {
  return fontScalePercent;
}

export function setFontScalePercent(percent: number) {
  const next = clampPercent(percent);
  if (next === fontScalePercent) return;
  fontScalePercent = next;
  try {
    globalThis.localStorage?.setItem(FONT_SCALE_STORAGE_KEY, String(next));
  } catch {
    // Storage is optional: the size still applies until the app restarts.
  }
  for (const listener of listeners) listener();
}

/** The font size multiplier; text re-renders when it changes. */
export function useFontScale() {
  return useSyncExternalStore(subscribe, getFontScalePercent, getFontScalePercent) / 100;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStoredFontScalePercent() {
  try {
    const stored = Number(globalThis.localStorage?.getItem(FONT_SCALE_STORAGE_KEY));
    return stored ? clampPercent(stored) : FONT_SCALE_PERCENT.default;
  } catch {
    return FONT_SCALE_PERCENT.default;
  }
}

function clampPercent(percent: number) {
  const { default: fallback, max, min, step } = FONT_SCALE_PERCENT;
  if (!Number.isFinite(percent)) return fallback;
  return Math.min(max, Math.max(min, Math.round(percent / step) * step));
}
