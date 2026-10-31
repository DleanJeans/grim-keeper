import type { Game, GamePhase, PlayerRoleAssignment, Role } from '@/types/game';
import {
  getDeathPhase,
  getEventPhaseIndex,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';
import { SUSPICION_LEVELS } from '@/utils/suspicion-utils';

export type TimelinePhase = {
  day: number;
  items: string[];
  phase: GamePhase;
};

const ASSIGNMENT_VERBS: Record<PlayerRoleAssignment['kind'], string> = {
  claim: 'Claimed',
  confirm: 'Confirmed as',
  guess: 'Guessed as',
  rumor: 'Rumored',
};

const SUSPICION_LABELS: Record<string, string> = {
  none: 'Mark cleared',
  suspect: 'Marked suspect',
  trusted: 'Marked trusted',
  unsure: 'Marked unsure',
};

/**
 * Everything recorded about one player, phase by phase up to the given one, newest first:
 * character assignments, notes, talks, nominations and votes, deaths, revives and marks.
 * With `showRoles` off, characters and marks are left out.
 */
export function getPlayerTimeline(
  game: Pick<Game, 'conversations' | 'playerDayNotes' | 'players' | 'suspicions'>,
  playerId: string,
  roles: Role[],
  lastDay: number,
  lastPhase: GamePhase,
  showRoles: boolean,
): TimelinePhase[] {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (!player) return [];
  const lastIndex = getEventPhaseIndex(lastDay, lastPhase);
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const roleName = (roleId: string) => {
    const baseId = roleId.replace(/_(?:good|evil)$/, '');
    const name = roleById.get(baseId)?.name ?? baseId;
    return roleId.endsWith('_evil') ? `evil ${name}` : name;
  };
  const nameOf = (id: string | undefined) =>
    game.players.find((candidate) => candidate.id === id)?.name ?? 'Unknown';
  const byIndex = new Map<number, string[]>();
  const add = (index: number, item: string) => {
    if (index > lastIndex || index < 0) return;
    byIndex.set(index, [...(byIndex.get(index) ?? []), item]);
  };

  if (showRoles) {
    for (const assignment of player.roleAssignments ?? []) {
      if (assignment.roleIds.length === 0) continue;
      const about =
        assignment.kind === 'rumor' && assignment.subjectPlayerId
          ? ` about ${nameOf(assignment.subjectPlayerId)}`
          : '';
      add(
        getEventPhaseIndex(assignment.day, assignment.phase ?? 'day'),
        `${ASSIGNMENT_VERBS[assignment.kind]}${about} ${assignment.roleIds.map(roleName).join(' or ')}`,
      );
    }
    for (const [key, value] of Object.entries(game.suspicions ?? {})) {
      const separator = key.indexOf(':');
      if (key.slice(separator + 1) !== playerId) continue;
      if (value !== 'none' && !SUSPICION_LEVELS.some((level) => level === value)) continue;
      add(Number(key.slice(0, separator)), SUSPICION_LABELS[value]);
    }
  }

  for (const dayNote of game.playerDayNotes ?? []) {
    if (dayNote.playerId !== playerId) continue;
    const index = getEventPhaseIndex(dayNote.day, dayNote.phase ?? 'day');
    for (const note of dayNote.notes) add(index, `Note: ${note.text}`);
  }

  for (const conversation of game.conversations) {
    const index = getEventPhaseIndex(conversation.day, 'day');
    if (conversation.kind === 'nomination') {
      const nomineeId = conversation.participantIds.find((id) => id !== conversation.initiatorId);
      const votes = conversation.voterIds?.length ?? 0;
      if (conversation.initiatorId === playerId) {
        add(index, `Nominated ${nameOf(nomineeId)} (${votes} ${votes === 1 ? 'vote' : 'votes'})`);
      }
      if (nomineeId === playerId) {
        add(
          index,
          `Nominated by ${nameOf(conversation.initiatorId)} (${votes} ${votes === 1 ? 'vote' : 'votes'})`,
        );
      }
      if (conversation.voterIds?.includes(playerId) && nomineeId !== playerId) {
        add(index, `Voted on ${nameOf(nomineeId)}`);
      }
    } else if (conversation.participantIds.includes(playerId)) {
      const others = conversation.participantIds.filter((id) => id !== playerId).map(nameOf);
      add(index, `Talked with ${others.join(', ')}`);
    }
  }

  if (player.death) {
    add(
      getEventPhaseIndex(player.death.day, getDeathPhase(player.death)),
      player.death.kind === 'execution' ? 'Executed' : 'Died',
    );
  }
  if (player.revive) add(getEventPhaseIndex(player.revive.day, 'day'), 'Came back to life');

  return [...byIndex]
    .sort(([a], [b]) => b - a)
    .map(([index, items]) => {
      const position = getPhasePositionAtIndex(index);
      return { day: position.activeDay, items, phase: position.activePhase };
    });
}
