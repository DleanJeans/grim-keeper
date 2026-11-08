import type { FakeEvilTeam, GamePhase, Player, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { pickRandomPlayers } from '@/utils/player-utils';
import { getAliveNeighbors, normalizeRoleInfoId } from '@/utils/role-info-utils';
import { getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

type Team = 'demon' | 'minion' | 'outsider' | 'townsfolk' | 'traveller';

/** What a fake info roll needs to know about the game. */
export type FakeInfoContext = {
  day: number;
  /** Player executed on the day before this night, for the Undertaker. */
  executed?: Player;
  /** Bluffs and the In play picks, which a fake info should not name as a good character. */
  excludedRoleIds?: Set<string>;
  /** Demon and Minion characters picked as in play, used for the fake team's characters. */
  inPlayRoleIds?: { demon?: Set<string>; minion?: Set<string> };
  /** The player whose info this is (the claimer). */
  ownerId?: string;
  phase: GamePhase;
  players: Player[];
  random?: () => number;
  roles: Role[];
  team: FakeEvilTeam;
};

const FAKE_INFO_ROLE_IDS = new Set([
  'chef',
  'clockmaker',
  'empath',
  'fortuneteller',
  'investigator',
  'librarian',
  'undertaker',
  'washerwoman',
]);

/** Characters whose Character info row can be rolled from a fake evil team. */
export function canFakeRoleInfo(role: Pick<Role, 'id'>) {
  return FAKE_INFO_ROLE_IDS.has(normalizeRoleInfoId(role.id));
}

/** Player ids on the fake evil team, Demon first. */
export function getFakeEvilIds(team: FakeEvilTeam | undefined) {
  if (!team) return [];
  return [...(team.demonId ? [team.demonId] : []), ...team.minionIds];
}

/** Players who can be on a fake evil team or be its red herring: not you, not a Storyteller. */
export function getFakeTeamCandidates(players: Player[]) {
  return players
    .filter((player) => !player.isStoryteller && player.id !== APP_USER_ID)
    .sort((first, second) => first.seat - second.seat);
}

/**
 * A random fake evil team of one Demon and `minionCount` Minions, plus a good red herring for the
 * Fortune Teller.
 */
export function rollFakeEvilTeam(
  players: Player[],
  minionCount: number,
  random: () => number = Math.random,
): FakeEvilTeam {
  const candidates = getFakeTeamCandidates(players);
  const [demon, ...rest] = pickRandomPlayers(candidates, 1 + minionCount + 1, random);
  const minions = rest.slice(0, minionCount);
  const redHerring = rest[minionCount];
  return {
    demonId: demon?.id,
    minionIds: minions.map((player) => player.id),
    redHerringId: redHerring?.id,
  };
}

/** The next role in the Demon → Minion → Red herring → none cycle for a tapped player. */
export type FakeTeamRole = 'demon' | 'minion' | 'redHerring';

export function getFakeTeamRole(
  team: FakeEvilTeam | undefined,
  playerId: string,
): FakeTeamRole | undefined {
  if (!team) return undefined;
  if (team.demonId === playerId) return 'demon';
  if (team.minionIds.includes(playerId)) return 'minion';
  if (team.redHerringId === playerId) return 'redHerring';
  return undefined;
}

/** Moves a player to the next fake team role: none → Demon → Minion → Red herring → none. */
export function cycleFakeTeamRole(team: FakeEvilTeam | undefined, playerId: string): FakeEvilTeam {
  const current = getFakeTeamRole(team, playerId);
  const without: FakeEvilTeam = {
    demonId: team?.demonId === playerId ? undefined : team?.demonId,
    minionIds: (team?.minionIds ?? []).filter((id) => id !== playerId),
    redHerringId: team?.redHerringId === playerId ? undefined : team?.redHerringId,
  };
  if (!current) {
    // A second Demon pushes the old one down to Minion.
    const minionIds = without.demonId ? [without.demonId, ...without.minionIds] : without.minionIds;
    return { ...without, demonId: playerId, minionIds };
  }
  if (current === 'demon') return { ...without, minionIds: [...without.minionIds, playerId] };
  if (current === 'minion') return { ...without, redHerringId: playerId };
  return without;
}

/**
 * Slot id → value for the character's Character info, made to agree with the fake evil team.
 * Undefined when the character has no rule or the team is missing what the rule needs.
 */
export function getFakeRoleInfoValues(
  role: Pick<Role, 'id'>,
  context: FakeInfoContext,
): Record<string, string> | undefined {
  const random = context.random ?? Math.random;
  const evilIds = new Set(getFakeEvilIds(context.team));
  if (evilIds.size === 0) return undefined;

  const seated = context.players
    .filter((player) => !player.isStoryteller)
    .sort((first, second) => first.seat - second.seat);
  const others = seated.filter((player) => player.id !== context.ownerId);
  const goodOthers = others.filter((player) => !evilIds.has(player.id));
  const pickOne = <T>(items: T[]) =>
    items.length > 0 ? items[Math.floor(random() * items.length)] : undefined;

  switch (normalizeRoleInfoId(role.id)) {
    case 'empath': {
      if (!context.ownerId) return undefined;
      const neighbors = getAliveNeighbors(
        context.players,
        context.ownerId,
        context.day,
        context.phase,
      );
      if (neighbors.length === 0) return undefined;
      return { '0': String(neighbors.filter((player) => evilIds.has(player.id)).length) };
    }
    case 'chef': {
      let pairs = 0;
      seated.forEach((player, index) => {
        const next = seated[(index + 1) % seated.length];
        if (seated.length > 1 && evilIds.has(player.id) && evilIds.has(next.id)) pairs += 1;
      });
      // Two seated players sit next to each other only once.
      if (seated.length === 2 && pairs === 2) pairs = 1;
      return { '0': String(pairs) };
    }
    case 'fortuneteller': {
      // One of the two is the red herring (or the Demon when there's no red herring), so Yes.
      const pingId = context.team.redHerringId ?? context.team.demonId;
      if (!pingId || pingId === context.ownerId) return undefined;
      const other = pickOne(others.filter((player) => player.id !== pingId));
      if (!other) return undefined;
      const pair = random() < 0.5 ? [pingId, other.id] : [other.id, pingId];
      return { '0': pair[0], '1': pair[1], '2': 'Yes' };
    }
    case 'clockmaker': {
      const steps = getDemonToMinionSteps(seated, context.team);
      return steps === undefined ? undefined : { '0': String(steps) };
    }
    case 'investigator': {
      const minionId = pickOne(context.team.minionIds);
      const decoy = pickOne(goodOthers);
      const minionRole = pickOne(
        getTeamRoles(context, 'minion', context.inPlayRoleIds?.minion, false),
      );
      if (!minionId || minionId === context.ownerId || !decoy || !minionRole) return undefined;
      return withPair(minionRole.id, minionId, decoy.id, random);
    }
    case 'washerwoman':
    case 'librarian': {
      const team: Team = normalizeRoleInfoId(role.id) === 'washerwoman' ? 'townsfolk' : 'outsider';
      const teamRoleIds = new Set(getTeamRoles(context, team).map((teamRole) => teamRole.id));
      // Prefer a good player who claims a character of that type, so the info backs them up.
      const claimers = goodOthers.filter((player) => {
        const claim = getClaimedRoleId(player, context.day, context.phase);
        return claim !== undefined && teamRoleIds.has(claim);
      });
      const target = pickOne(claimers.length > 0 ? claimers : goodOthers);
      if (!target) return undefined;
      const claimed = getClaimedRoleId(target, context.day, context.phase);
      const targetRoleId =
        claimed && teamRoleIds.has(claimed)
          ? claimed
          : pickOne(getTeamRoles(context, team, undefined, true))?.id;
      const decoy = pickOne(others.filter((player) => player.id !== target.id));
      if (!targetRoleId || !decoy) return undefined;
      return withPair(targetRoleId, target.id, decoy.id, random);
    }
    case 'undertaker': {
      const executed = context.executed;
      if (!executed) return undefined;
      const fakeTeam =
        context.team.demonId === executed.id
          ? 'demon'
          : context.team.minionIds.includes(executed.id)
            ? 'minion'
            : undefined;
      const roleId = fakeTeam
        ? pickOne(getTeamRoles(context, fakeTeam, context.inPlayRoleIds?.[fakeTeam], false))?.id
        : (getClaimedRoleId(executed, context.day, context.phase) ??
          pickOne(getTeamRoles(context, 'townsfolk', undefined, true))?.id);
      return roleId ? { '0': roleId } : undefined;
    }
    default:
      return undefined;
  }
}

/** Script characters of the team; In play picks first when there are any. */
function getTeamRoles(
  context: FakeInfoContext,
  team: Team,
  preferredIds?: Set<string>,
  leaveOutExcluded = false,
) {
  const teamRoles = context.roles.filter((role) => role.team?.toLocaleLowerCase() === team);
  const preferred = preferredIds ? teamRoles.filter((role) => preferredIds.has(role.id)) : [];
  if (preferred.length > 0) return preferred;
  return leaveOutExcluded
    ? teamRoles.filter((role) => !context.excludedRoleIds?.has(role.id))
    : teamRoles;
}

function withPair(roleId: string, targetId: string, decoyId: string, random: () => number) {
  const [first, second] = random() < 0.5 ? [targetId, decoyId] : [decoyId, targetId];
  return { '0': roleId, '1': first, '2': second };
}

/** The player's claim by then, or failing that their first claim made later in the game. */
function getClaimedRoleId(player: Player, day: number, phase: GamePhase) {
  const claim =
    getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'claim', phase) ??
    player.roleAssignments?.find((assignment) => assignment.kind === 'claim');
  return claim?.roleIds[0];
}

/** Fewest seats from the Demon to a Minion going either way round the circle. */
function getDemonToMinionSteps(seated: Player[], team: FakeEvilTeam) {
  const demonIndex = seated.findIndex((player) => player.id === team.demonId);
  if (demonIndex < 0) return undefined;

  const distances = team.minionIds
    .map((minionId) => seated.findIndex((player) => player.id === minionId))
    .filter((index) => index >= 0)
    .map((index) => {
      const distance = Math.abs(index - demonIndex);
      return Math.min(distance, seated.length - distance);
    });
  return distances.length > 0 ? Math.min(...distances) : undefined;
}
