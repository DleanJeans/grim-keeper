import type { Game, GamePhase, Player, Role, StartingNight } from '@/types/game';
import { getDayRecap } from '@/utils/day-recap-utils';
import { getEventPhaseIndex, getPhaseLabel } from '@/utils/game-phase-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

type SummaryOptions = {
  activeDay: number;
  activePhase: GamePhase;
  roles: Role[];
  /** Off leaves claims and characters out. */
  showRoles: boolean;
  startingNight: StartingNight;
};

/**
 * Plain-text summary of the game up to the given phase, to paste into a group chat: players in
 * seat order with their claims and deaths, then what happened each night and day.
 */
export function getGameSummaryText(
  game: Pick<Game, 'conversations' | 'players' | 'script'>,
  { activeDay, activePhase, roles, showRoles, startingNight }: SummaryOptions,
): string {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const roleName = (roleId: string) => {
    const baseId = roleId.replace(/_(?:good|evil)$/, '');
    const name = roleById.get(baseId)?.name ?? baseId;
    return roleId.endsWith('_evil') ? `evil ${name}` : name;
  };
  const players = game.players
    .filter((player) => !player.isStoryteller)
    .sort((a, b) => a.seat - b.seat);
  const position = { activeDay, activePhase };
  const lines = [
    game.script?.name
      ? `${game.script.name}, ${getPhaseLabel(position, startingNight)}`
      : getPhaseLabel(position, startingNight),
    '',
    'Players',
    ...players.map(
      (player, index) =>
        `${index + 1}. ${getPlayerLine(player, activeDay, activePhase, showRoles, roleName, startingNight)}`,
    ),
  ];

  const activeIndex = getEventPhaseIndex(activeDay, activePhase);
  for (let day = 1; day <= activeDay; day += 1) {
    const recap = getDayRecap(game, day, roles, showRoles);
    const phases: Array<[GamePhase, typeof recap.day]> = [
      ['night', recap.night],
      ['day', recap.day],
    ];
    for (const [phase, events] of phases) {
      if (getEventPhaseIndex(day, phase) > activeIndex || events.length === 0) continue;
      lines.push('', getPhaseLabel({ activeDay: day, activePhase: phase }, startingNight));
      lines.push(...events.map((event) => `- ${event.text}`));
    }
  }

  return lines.join('\n');
}

function getPlayerLine(
  player: Player,
  day: number,
  phase: GamePhase,
  showRoles: boolean,
  roleName: (roleId: string) => string,
  startingNight: StartingNight,
) {
  const parts = [player.name];
  if (showRoles) {
    const claim = getRoleAssignmentForDayOrPrevious(player.roleAssignments, day, 'claim', phase);
    const confirm = getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      day,
      'confirm',
      phase,
    );
    if (claim?.roleIds.length) parts.push(`claims ${claim.roleIds.map(roleName).join(' or ')}`);
    if (confirm?.roleIds.length) parts.push(`is ${confirm.roleIds.map(roleName).join(' or ')}`);
  }
  if (player.death && isPlayerCurrentlyDead(player, day, phase)) {
    const deathPhase = player.death.kind === 'execution' ? 'day' : 'night';
    const when = getPhaseLabel(
      { activeDay: player.death.day, activePhase: deathPhase },
      startingNight,
    );
    parts.push(player.death.kind === 'execution' ? `executed ${when}` : `died ${when}`);
  }
  return parts.join(', ');
}
