import type { Game, GamePhase, Player, Role } from '@/types/game';
import { getEffectiveRoleForPlayer, getRoleAlignment } from '@/utils/role-utils';

/** A theory's name, built from who is evil in it: "Ann + Bob evil", in seat order. */
export function getTheoryLabel(evilPlayerIds: string[], players: Player[]) {
  const names = players
    .filter((player) => evilPlayerIds.includes(player.id))
    .map((player) => player.name);
  return names.length === 0 ? 'Nobody evil yet' : `${names.join(' + ')} evil`;
}

/** Players evil in the game's active theory; empty when no theory is selected. */
export function getActiveTheoryEvilIds(game: Pick<Game, 'activeTheoryId' | 'theories'>) {
  return game.theories?.find((theory) => theory.id === game.activeTheoryId)?.evilPlayerIds ?? [];
}

/**
 * Problems with a theory: more evil players than the setup has Minions and Demons, a player
 * confirmed as a good character marked evil, or a confirmed evil player left out.
 */
export function getTheoryWarnings(
  evilPlayerIds: string[],
  players: Player[],
  roles: Role[],
  day: number,
  phase: GamePhase,
  expectedEvilCount: number,
): string[] {
  const warnings: string[] = [];
  if (evilPlayerIds.length > expectedEvilCount) {
    warnings.push(
      `${evilPlayerIds.length} marked evil, but the setup has ${expectedEvilCount} evil ${expectedEvilCount === 1 ? 'player' : 'players'}`,
    );
  }
  for (const player of players) {
    const effective = getEffectiveRoleForPlayer(player, roles, day, phase);
    if (effective.kind !== 'confirm' || !effective.role) continue;
    const alignment = getRoleAlignment(effective.role);
    const markedEvil = evilPlayerIds.includes(player.id);
    if (markedEvil && alignment === 'g') {
      warnings.push(`${player.name} is confirmed as ${effective.role.name}`);
    } else if (!markedEvil && alignment === 'e') {
      warnings.push(`${player.name} is confirmed evil (${effective.role.name}) but not marked`);
    }
  }
  return warnings;
}
