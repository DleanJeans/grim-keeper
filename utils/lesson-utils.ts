import type { Game, GamePhase, Role, SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { getRoleAlignment, getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';
import { getNotesForPlayer } from '@/utils/saved-note-store';

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

/** Notes saved about a player in other games, newest first: what to remember about them now. */
export function getPlayerLessons(savedNotes: SavedNote[], playerName: string, gameId: string) {
  return getNotesForPlayer(savedNotes, playerName).filter((note) => note.gameId !== gameId);
}

export type PlayerLessons = { lessons: SavedNote[]; playerId: string; playerName: string };

/** Every player in the game, in seat order, who has lessons from other games. */
export function getLessonsForPlayers(
  game: Pick<Game, 'id' | 'players'>,
  savedNotes: SavedNote[],
): PlayerLessons[] {
  return game.players.flatMap((player) => {
    if (player.id === APP_USER_ID || player.isStoryteller) return [];
    const lessons = getPlayerLessons(savedNotes, player.name, game.id);
    return lessons.length > 0 ? [{ lessons, playerId: player.id, playerName: player.name }] : [];
  });
}

export type CharacterLessons = {
  /** Stable id of the group: the main character's id plus the note's other character ids. */
  key: string;
  lessons: SavedNote[];
  /** The note's other characters, in its own order. */
  otherRoleIds: string[];
  /** The character the notes are listed under. */
  role: Role;
};

/**
 * Notes from other games that are only about characters (no friend tagged), grouped under the
 * note's first character (in its own role order) that is on this game's script, together with
 * the same other characters. Groups follow script order, then the newest note; notes in a group
 * are newest first.
 */
export function getLessonsForScriptCharacters(
  game: Pick<Game, 'id' | 'script'>,
  savedNotes: SavedNote[],
  appUserName: string,
): CharacterLessons[] {
  const roles = game.script?.roles ?? [];
  const appUserKey = normalizePlayerName(appUserName).toLocaleLowerCase();
  const indexById = new Map(roles.map((role, index) => [role.id, index]));
  const groups = new Map<string, { index: number; lessons: SavedNote[]; otherRoleIds: string[] }>();
  const sorted = [...savedNotes].sort((first, second) =>
    second.createdAt.localeCompare(first.createdAt),
  );
  for (const note of sorted) {
    const playerKey = normalizePlayerName(note.playerName).toLocaleLowerCase();
    if (note.gameId === game.id || (playerKey && playerKey !== appUserKey)) continue;
    const mainPosition = note.roleIds.findIndex((roleId) => indexById.has(stripTeam(roleId)));
    if (mainPosition < 0) continue;
    const index = indexById.get(stripTeam(note.roleIds[mainPosition])) as number;
    const otherRoleIds = note.roleIds.filter((_, position) => position !== mainPosition);
    const key = [roles[index].id, ...otherRoleIds].join('|');
    const group = groups.get(key) ?? { index, lessons: [], otherRoleIds };
    group.lessons.push(note);
    groups.set(key, group);
  }
  return [...groups.entries()]
    .sort(([, first], [, second]) => first.index - second.index)
    .map(([key, { index, lessons, otherRoleIds }]) => ({
      key,
      lessons,
      otherRoleIds,
      role: roles[index],
    }));
}

/** A note's character, looked up on the script first, then the catalog, with or without its team. */
export function findNoteRole(roleId: string, scriptRoles: Role[], roleCatalog: Role[]) {
  const find = (id: string) =>
    scriptRoles.find((role) => role.id === id) ?? roleCatalog.find((role) => role.id === id);
  return find(roleId) ?? find(stripTeam(roleId));
}

function stripTeam(roleId: string) {
  return roleId.replace(/_(?:good|evil)$/, '');
}
