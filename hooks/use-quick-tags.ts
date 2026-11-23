import { useGameStore } from '@/store/game-store';
import { DEFAULT_QUICK_TAGS } from '@/utils/quick-tag-utils';

/** The player tags to offer, from the global list the user edits. */
export function useQuickTags() {
  return useGameStore((state) => state.quickTags) ?? DEFAULT_QUICK_TAGS;
}
