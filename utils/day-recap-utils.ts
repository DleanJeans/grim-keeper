import type { Game, GamePhase, Player, PlayerRoleAssignment, Role } from '@/types/game';
import { getDeathPhase, getEventPhaseIndex } from '@/utils/game-phase-utils';
import { getOnTheBlockNominationId, getVotesToExecute } from '@/utils/nomination-utils';

export type RecapEventKind = 'claim' | 'death' | 'execution' | 'nomination' | 'revive';

export type RecapEvent = {
  id: string;
  kind: RecapEventKind;
  text: string;
};

export type DayRecap = {
  day: RecapEvent[];
  night: RecapEvent[];
};

const RECAP_KINDS: PlayerRoleAssignment['kind'][] = ['claim', 'confirm'];

/**
 * What happened in Night `day` and then Day `day`: claims, nominations, deaths and revives.
 * With `showRoles` off, claims and killer characters are left out.
 */
export function getDayRecap(
  game: Pick<Game, 'conversations' | 'players'>,
  day: number,
  roles: Role[],
  showRoles = true,
): DayRecap {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const roleName = (roleId: string) => {
    const baseId = roleId.replace(/_(?:good|evil)$/, '');
    const name = roleById.get(baseId)?.name ?? baseId;
    return roleId.endsWith('_evil') ? `evil ${name}` : name;
  };
  const players = game.players.filter((player) => !player.isStoryteller);
  const playerName = (playerId: string) =>
    game.players.find((player) => player.id === playerId)?.name ?? 'Unknown';

  const getPhaseEvents = (phase: GamePhase): RecapEvent[] => {
    const events: RecapEvent[] = [];

    for (const player of showRoles ? players : []) {
      for (const kind of RECAP_KINDS) {
        const roleIds = getNewAssignmentRoleIds(player, day, phase, kind);
        if (!roleIds) continue;
        const roleText = roleIds.map(roleName).join(' or ');
        events.push({
          id: `${kind}-${player.id}`,
          kind: 'claim',
          text:
            kind === 'claim'
              ? `${player.name} claimed ${roleText}`
              : `${player.name} confirmed as ${roleText}`,
        });
      }
    }

    if (phase === 'day') {
      const nominations = game.conversations.filter(
        (conversation) => conversation.kind === 'nomination' && conversation.day === day,
      );
      const votesNeeded = getVotesToExecute(game.players, day);
      const onTheBlockId = getOnTheBlockNominationId(nominations, game.players, day);
      for (const nomination of nominations) {
        const nomineeId = nomination.participantIds.find(
          (playerId) => playerId !== nomination.initiatorId,
        );
        const votes = nomination.voterIds?.length ?? 0;
        events.push({
          id: `nomination-${nomination.id}`,
          kind: 'nomination',
          text: `${playerName(nomination.initiatorId)} nominated ${
            nomineeId ? playerName(nomineeId) : 'Unknown'
          }: ${votes}/${votesNeeded} votes${nomination.id === onTheBlockId ? ', on the block' : ''}`,
        });
      }
    }

    for (const player of players) {
      const { death, revive } = player;
      if (death && death.day === day && getDeathPhase(death) === phase) {
        const killers = showRoles ? (death.killerRoleIds ?? []).map(roleName) : [];
        events.push({
          id: `death-${player.id}`,
          kind: death.kind === 'execution' ? 'execution' : 'death',
          text:
            death.kind === 'execution'
              ? `${player.name} was executed`
              : `${player.name} died${killers.length > 0 ? ` (${killers.join(', ')})` : ''}`,
        });
      }
      if (revive && revive.day === day && phase === 'day') {
        events.push({
          id: `revive-${player.id}`,
          kind: 'revive',
          text: `${player.name} came back`,
        });
      }
    }

    return events;
  };

  return { day: getPhaseEvents('day'), night: getPhaseEvents('night') };
}

/** Role ids of the player's latest claim or confirm in that phase, if it changed from before. */
function getNewAssignmentRoleIds(
  player: Player,
  day: number,
  phase: GamePhase,
  kind: PlayerRoleAssignment['kind'],
): string[] | undefined {
  const phaseIndex = getEventPhaseIndex(day, phase);
  const assignments = (player.roleAssignments ?? []).filter(
    (assignment) => assignment.kind === kind && assignment.roleIds.length > 0,
  );
  const indexOf = (assignment: PlayerRoleAssignment) =>
    getEventPhaseIndex(assignment.day, assignment.phase ?? 'day');
  const latest = (list: PlayerRoleAssignment[]) =>
    list.reduce<PlayerRoleAssignment | undefined>(
      (found, assignment) =>
        !found ||
        indexOf(assignment) > indexOf(found) ||
        (indexOf(assignment) === indexOf(found) && assignment.updatedAt >= found.updatedAt)
          ? assignment
          : found,
      undefined,
    );
  const current = latest(assignments.filter((assignment) => indexOf(assignment) === phaseIndex));
  if (!current) return undefined;
  const previous = latest(assignments.filter((assignment) => indexOf(assignment) < phaseIndex));
  const sameAsBefore =
    previous &&
    previous.roleIds.length === current.roleIds.length &&
    previous.roleIds.every((roleId) => current.roleIds.includes(roleId));
  return sameAsBefore ? undefined : current.roleIds;
}
