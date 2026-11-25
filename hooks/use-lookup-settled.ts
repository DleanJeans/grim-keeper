import { useEffect, useState } from 'react';

import { useGameStore } from '@/store/game-store';

const SETTLE_DELAY_MS = 250;

/**
 * True once the game store has finished hydrating and a short grace period has passed,
 * so "not found" screens do not flash while a route's data is still arriving.
 */
export function useLookupSettled() {
  const [hydrated, setHydrated] = useState(false);
  const [graceOver, setGraceOver] = useState(false);

  useEffect(() => {
    if (useGameStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useGameStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setGraceOver(true), SETTLE_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return hydrated && graceOver;
}
