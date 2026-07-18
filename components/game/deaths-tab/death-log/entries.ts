import type { Player, PlayerDeath, PlayerRevive } from '@/types/game';

import type { DeathLogEntry, ReviveLogEntry } from './row';

export function collectLogEntries(
  players: Player[],
  activeDay: number,
): Array<DeathLogEntry | ReviveLogEntry> {
  const deathEntries: DeathLogEntry[] = players
    .filter((player): player is Player & { death: PlayerDeath } => {
      if (!player.death) {
        return false;
      }

      return player.death.day <= activeDay;
    })
    .map((player) => ({ death: player.death, player }));

  const reviveEntries: ReviveLogEntry[] = players
    .filter((player): player is Player & { revive: PlayerRevive } => {
      if (!player.revive) {
        return false;
      }

      return player.revive.day <= activeDay;
    })
    .map((player) => ({ player, revive: player.revive }));

  return [...deathEntries, ...reviveEntries].sort((first, second) => {
    const firstDay = 'death' in first ? first.death.day : first.revive.day;
    const secondDay = 'death' in second ? second.death.day : second.revive.day;
    const firstIsRevive = 'revive' in first;
    const secondIsRevive = 'revive' in second;

    if (firstDay !== secondDay) {
      return firstDay - secondDay;
    }

    // Within the same day: night deaths, executions, then revives
    if (firstIsRevive !== secondIsRevive) {
      return firstIsRevive ? 1 : -1;
    }

    if (!firstIsRevive && !secondIsRevive) {
      const firstDeath = (first as DeathLogEntry).death;
      const secondDeath = (second as DeathLogEntry).death;

      if (firstDeath.kind !== secondDeath.kind) {
        return firstDeath.kind === 'night' ? -1 : 1;
      }
    }

    return first.player.name.localeCompare(second.player.name);
  });
}
