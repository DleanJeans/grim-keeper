import { useMemo } from 'react';

import { useGameRouteContext } from '@/components/game/game-route-context';
import type { RoleKind } from '@/components/game/role-assignment/role-kinds';
import { useGameStore } from '@/store/game-store';
import type { Role } from '@/types/game';
import { getEventPhaseIndex } from '@/utils/game-phase-utils';
import { getLatestHistoryEntry, getRoleAssignmentHistory } from '@/utils/role-assignment-history';
import { getRolesByIds } from '@/utils/role-utils';

/** The selected player's logged roles of one kind, and what they show in the active phase. */
export function useRoleAssignmentHistory(kind: RoleKind) {
  const { activeDay, activePhase, focusedPlayer, game, players } = useGameRouteContext();
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const focusedPlayerId = focusedPlayer?.id;
  const currentPhaseIndex = getEventPhaseIndex(activeDay, activePhase);
  const entries = useMemo(
    () => (focusedPlayerId ? getRoleAssignmentHistory(players, focusedPlayerId, kind) : []),
    [focusedPlayerId, kind, players],
  );
  const knownRoles = useMemo(
    () => [...(game.script?.roles ?? []), ...roleCatalog],
    [game.script?.roles, roleCatalog],
  );
  const latest = getLatestHistoryEntry(entries, currentPhaseIndex);
  const latestRoles: Role[] = latest ? getRolesByIds(latest.roleIds, knownRoles) : [];

  return { currentPhaseIndex, entries, knownRoles, latest, latestRoles };
}
