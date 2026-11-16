import type { CharacterTypeCounts } from '@/types/game';

/** Standard setup for the player count (travellers excluded). */
export function getAutomaticCharacterTypeCounts(playerCount: number): CharacterTypeCounts {
  if (playerCount <= 5) return { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 6) return { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 7) return { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 };
  if (playerCount === 8) return { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 };
  if (playerCount === 9) return { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 };
  if (playerCount === 10) return { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 };
  if (playerCount === 11) return { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 };
  if (playerCount === 12) return { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 };
  if (playerCount === 13) return { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 };
  if (playerCount === 14) return { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 };
  return { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 };
}
