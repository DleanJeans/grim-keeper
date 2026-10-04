import type { Player, PlayerDeath, PlayerRevive } from '@/types/game';
import type { GamePhasePosition } from '@/utils/game-phase-utils';
import { getEventPhaseIndex, getPhaseIndex } from '@/utils/game-phase-utils';

import type { DeathLogEntry, ReviveLogEntry } from './row';

export function collectLogEntries(
  players: Player[],
  position: GamePhasePosition,
): Array<DeathLogEntry | ReviveLogEntry> {
  const activePhaseIndex = getPhaseIndex(position);
  const deathEntries: DeathLogEntry[] = players
    .filter((player): player is Player & { death: PlayerDeath } => {
      if (!player.death) {
        return false;
      }

      return (
        getEventPhaseIndex(player.death.day, player.death.kind === 'night' ? 'night' : 'day') <=
        activePhaseIndex
      );
    })
    .map((player) => ({ death: player.death, player }));

  const reviveEntries: ReviveLogEntry[] = players
    .filter((player): player is Player & { revive: PlayerRevive } => {
      if (!player.revive) {
        return false;
      }

      return getEventPhaseIndex(player.revive.day, 'day') <= activePhaseIndex;
    })
    .map((player) => ({ player, revive: player.revive }));

  return [...deathEntries, ...reviveEntries].sort((first, second) => {
    const firstDay = 'death' in first ? first.death.day : first.revive.day;
    const secondDay = 'death' in second ? second.death.day : second.revive.day;
    const firstIsRevive = 'revive' in first;
    const secondIsRevive = 'revive' in second;
    const firstPhase = 'death' in first ? first.death.kind : 'day';
    const secondPhase = 'death' in second ? second.death.kind : 'day';
    const firstPhaseIndex = getEventPhaseIndex(firstDay, firstPhase === 'night' ? 'night' : 'day');
    const secondPhaseIndex = getEventPhaseIndex(
      secondDay,
      secondPhase === 'night' ? 'night' : 'day',
    );

    return (
      firstPhaseIndex - secondPhaseIndex ||
      Number(firstIsRevive) - Number(secondIsRevive) ||
      first.player.name.localeCompare(second.player.name)
    );
  });
}
