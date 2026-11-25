import 'expo-sqlite/localStorage/install';
import { useState } from 'react';

const STORAGE_KEY = 'grim-keeper-lessons-collapsed';

/** Whether the "Lessons for tonight" card is collapsed; remembered on this device for every game. */
export function useLessonsCollapsed() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Storage is optional: the card still collapses until the app restarts.
    }
  };

  return [collapsed, toggle] as const;
}

function readCollapsed() {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}
