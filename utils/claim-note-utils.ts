import type { Game, GamePhase, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

export type ClaimNoteDraft = {
  playerId: string;
  playerName: string;
  /** Claimed characters, then the confirmed one when it differs. */
  roleIds: string[];
  text: string;
};

/**
 * One note per player who claimed a character, for saving to future games once a game ends:
 * what they claimed and, when confirmed, what they really were.
 */
export function getClaimNoteDrafts(
  game: Pick<Game, 'players'>,
  roles: Role[],
  lastDay: number,
  lastPhase: GamePhase,
): ClaimNoteDraft[] {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const baseId = (roleId: string) => roleId.replace(/_(?:good|evil)$/, '');
  const nameOf = (roleId: string) => {
    const name = roleById.get(baseId(roleId))?.name ?? baseId(roleId);
    return roleId.endsWith('_evil') ? `evil ${name}` : name;
  };

  return game.players.flatMap((player) => {
    if (player.id === APP_USER_ID || player.isStoryteller) return [];
    const claim = getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      lastDay,
      'claim',
      lastPhase,
    );
    if (!claim || claim.roleIds.length === 0) return [];
    const confirmed = getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      lastDay,
      'confirm',
      lastPhase,
    );
    const claimText = `Claimed ${claim.roleIds.map(nameOf).join(' or ')}.`;
    const trueRoleId = confirmed?.roleIds[0];
    const claimedBaseIds = claim.roleIds.map(baseId);
    let outcome = '';
    if (trueRoleId) {
      outcome =
        claim.roleIds.includes(trueRoleId) && claim.roleIds.length === 1
          ? ' It was true.'
          : ` Was really the ${nameOf(trueRoleId)}.`;
    }
    const roleIds = [...new Set([...claimedBaseIds, ...(trueRoleId ? [baseId(trueRoleId)] : [])])];
    return [
      {
        playerId: player.id,
        playerName: player.name,
        roleIds,
        text: `${claimText}${outcome}`,
      },
    ];
  });
}
