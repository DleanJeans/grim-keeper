import type { Player } from '@/types/game';

export function isPlayerCurrentlyDead(player: Player, activeDay: number): boolean {
  if (!player.death) {
    return false;
  }

  if (player.death.day > activeDay) {
    return false;
  }

  if (player.revive && player.revive.day <= activeDay && player.revive.day >= player.death.day) {
    return false;
  }

  return true;
}
