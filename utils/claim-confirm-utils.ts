import type { Game, GamePhase } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

export type ClaimToConfirm = { playerId: string; roleId: string };

/**
 * Players whose latest claim is a single character and who have no confirmed character yet,
 * so the claims can be turned into confirms in one go after a game. Multi-claims are skipped.
 */
export function getClaimsToConfirm(
  game: Pick<Game, 'players'>,
  day: number,
  phase: GamePhase,
): ClaimToConfirm[] {
  return game.players.flatMap((player) => {
    if (player.id === APP_USER_ID || player.isStoryteller) return [];
    const claim = getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'claim', phase);
    if (claim?.roleIds.length !== 1) return [];
    const confirmed = getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      day,
      'confirm',
      phase,
    );
    if (confirmed?.roleIds.length) return [];
    return [{ playerId: player.id, roleId: claim.roleIds[0] }];
  });
}
