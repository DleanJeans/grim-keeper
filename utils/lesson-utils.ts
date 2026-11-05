import type { Game, GamePhase, Role, SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { getRoleAlignment, getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

export type LessonPlayer = {
  playerId: string;
  playerName: string;
  /** "Slayer → Scarlet Woman", "Empath", or undefined when nothing was claimed or confirmed. */
  roleText?: string;
  /** The confirmed character, or the single claim when nothing was confirmed, is evil. */
  evil: boolean;
};

/**
 * The players a lesson can be written about once a game ends, in seat order: everyone except
 * you and the Storyteller, with what they claimed and what they really were.
 */
export function getLessonPlayers(
  game: Pick<Game, 'players'>,
  roles: Role[],
  lastDay: number,
  lastPhase: GamePhase,
): LessonPlayer[] {
  const roleById = new Map(roles.map((role) => [role.id, role]));
  const findRole = (roleId: string): Role | undefined =>
    roleById.get(roleId) ?? roleById.get(roleId.replace(/_(?:good|evil)$/, ''));
  const nameOf = (roleId: string) => {
    const name = findRole(roleId)?.name ?? roleId.replace(/_(?:good|evil)$/, '');
    return roleId.endsWith('_evil') ? `Evil ${name}` : name;
  };
  const isEvil = (roleId: string) => {
    if (roleId.endsWith('_evil')) return true;
    const role = findRole(roleId);
    return !!role && getRoleAlignment(role) === 'e';
  };

  return game.players.flatMap((player) => {
    if (player.id === APP_USER_ID || player.isStoryteller) return [];
    const claimIds =
      getRoleAssignmentForDayOrPrevious(player.roleAssignments, lastDay, 'claim', lastPhase)
        ?.roleIds ?? [];
    const trueId = getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      lastDay,
      'confirm',
      lastPhase,
    )?.roleIds[0];
    const claimText = claimIds.map(nameOf).join(' / ');
    let roleText: string | undefined;
    if (trueId && claimIds.length > 0 && !(claimIds.length === 1 && claimIds[0] === trueId)) {
      roleText = `${claimText} → ${nameOf(trueId)}`;
    } else if (trueId) {
      roleText = nameOf(trueId);
    } else if (claimText) {
      roleText = claimText;
    }
    const shownId = trueId ?? (claimIds.length === 1 ? claimIds[0] : undefined);
    return [
      {
        evil: !!shownId && isEvil(shownId),
        playerId: player.id,
        playerName: player.name,
        roleText,
      },
    ];
  });
}

/** Lessons saved about a player in one game, oldest first. */
export function getLessonsFromGame(savedNotes: SavedNote[], playerName: string, gameId: string) {
  const playerKey = normalizePlayerName(playerName).toLocaleLowerCase();
  return savedNotes
    .filter(
      (note) =>
        note.gameId === gameId &&
        normalizePlayerName(note.playerName).toLocaleLowerCase() === playerKey,
    )
    .sort((first, second) => first.createdAt.localeCompare(second.createdAt));
}
