import type { GamePhase, Player, Role } from '@/types/game';
import { getBluffTargetPlayers, isPlayerCurrentlyDead } from '@/utils/player-utils';

export type RandomRoleTeam = 'demon' | 'minion' | 'outsider' | 'townsfolk';

export const RANDOM_ROLE_TEAMS: { label: string; team: RandomRoleTeam }[] = [
  { label: 'Townsfolk', team: 'townsfolk' },
  { label: 'Outsider', team: 'outsider' },
  { label: 'Minion', team: 'minion' },
  { label: 'Demon', team: 'demon' },
];

export type RandomRoleFilters = {
  /** Only these teams; empty means any team. */
  teams: RandomRoleTeam[];
  /** Leave out the bluffs, and keep only the Demons and Minions picked as in play (if any). */
  inPlayOnly: boolean;
  /** Leave out characters whose ability starts with "You start knowing". */
  noStartKnowing: boolean;
};

/** Players a random pick can land on: not you or a Storyteller, and alive only if asked. */
export function getRandomPlayerCandidates(
  players: Player[],
  aliveOnly: boolean,
  day: number,
  phase: GamePhase,
) {
  const candidates = getBluffTargetPlayers(players);
  return aliveOnly
    ? candidates.filter((player) => !isPlayerCurrentlyDead(player, day, phase))
    : candidates;
}

/** "You start knowing" characters, which learn their info on the first night. */
export function isStartKnowingRole(role: Pick<Role, 'ability'>) {
  return /\byou start knowing\b/i.test(role.ability ?? '');
}

/** Script characters (no Travellers or Fabled) that a random character pick can land on. */
export function getRandomRoleCandidates(
  roles: Role[],
  filters: RandomRoleFilters,
  bluffRoleIds: Set<string>,
  evilInPlayRoleIds: Map<string, Set<string>>,
) {
  return roles.filter((role) => {
    const team = RANDOM_ROLE_TEAMS.find(
      (option) => option.team === role.team?.toLocaleLowerCase(),
    )?.team;
    if (!team) return false;
    if (filters.teams.length > 0 && !filters.teams.includes(team)) return false;
    if (filters.noStartKnowing && isStartKnowingRole(role)) return false;
    if (filters.inPlayOnly) {
      if (bluffRoleIds.has(role.id)) return false;
      const inPlay = evilInPlayRoleIds.get(team);
      if (inPlay && inPlay.size > 0 && !inPlay.has(role.id)) return false;
    }
    return true;
  });
}
