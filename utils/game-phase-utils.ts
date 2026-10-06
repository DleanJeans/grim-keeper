import type { Game, GamePhase, StartingNight } from '@/types/game';

export type GamePhasePosition = {
  activeDay: number;
  activePhase: GamePhase;
};

export function getGameStartingNight(game: Pick<Game, 'startingNight'>): StartingNight {
  return game.startingNight === 0 ? 0 : 1;
}

export function getGameActivePhase(game: Pick<Game, 'activePhase'>): GamePhase {
  return game.activePhase === 'night' ? 'night' : 'day';
}

export function getPhaseIndex(position: GamePhasePosition): number {
  return position.activePhase === 'night'
    ? 2 * (position.activeDay - 1)
    : 2 * position.activeDay - 1;
}

export function getPhasePositionAtIndex(index: number): GamePhasePosition {
  if (index % 2 === 0) {
    return {
      activeDay: 1 + index / 2,
      activePhase: 'night',
    };
  }

  return {
    activeDay: (index + 1) / 2,
    activePhase: 'day',
  };
}

export function getAdjacentPhasePosition(
  position: GamePhasePosition,
  direction: -1 | 1,
): GamePhasePosition {
  return getPhasePositionAtIndex(getPhaseIndex(position) + direction);
}

export function getDayCutoffForPhase(position: GamePhasePosition): number {
  return Math.floor((getPhaseIndex(position) + 1) / 2);
}

// Stored event days stay one-based; this setting only offsets the displayed night number.
export function getEventPhaseIndex(day: number, eventPhase: GamePhase): number {
  return eventPhase === 'night' ? 2 * (day - 1) : 2 * day - 1;
}

// Stored event days stay one-based; this setting only offsets the displayed night number.
export function getPhaseLabel(position: GamePhasePosition, startingNight: StartingNight): string {
  const label = position.activePhase === 'night' ? 'Night' : 'Day';
  const day =
    position.activePhase === 'night' ? position.activeDay + startingNight - 1 : position.activeDay;

  return `${label} ${day}`;
}

export function getLatestPhaseWithData(game: Game): GamePhasePosition {
  let latestPhaseIndex = -1;

  const include = (day: number, phase: GamePhase) => {
    latestPhaseIndex = Math.max(latestPhaseIndex, getEventPhaseIndex(day, phase));
  };

  for (const conversation of game.conversations) {
    include(conversation.day, 'day');
  }

  for (const entry of game.playerDayNotes ?? []) {
    include(entry.day, entry.phase ?? 'day');
  }

  for (const entry of game.roleInfos ?? []) {
    include(entry.day, entry.phase);
  }

  for (const player of game.players) {
    for (const assignment of player.roleAssignments ?? []) {
      include(assignment.day, assignment.phase ?? 'day');
    }

    if (player.death) {
      include(player.death.day, getDeathPhase(player.death));
    }

    if (player.revive) {
      include(player.revive.day, 'day');
    }
  }

  return latestPhaseIndex < 0
    ? {
        activeDay: game.activeDay,
        activePhase: getGameActivePhase(game),
      }
    : getPhasePositionAtIndex(latestPhaseIndex);
}

export function getDeathPhase(death: {
  kind: 'execution' | 'night';
  killerRoleIds?: string[];
}): GamePhase {
  return death.kind === 'execution' || death.killerRoleIds?.includes('witch') ? 'day' : 'night';
}
