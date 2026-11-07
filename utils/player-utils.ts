import type { Conversation, GamePhase, Player } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getDeathPhase, getEventPhaseIndex, getPhaseIndex } from '@/utils/game-phase-utils';
import { getRoleAssignmentForDayOrPrevious } from '@/utils/role-utils';

const BANSHEE_ROLE_ID = 'banshee';

export function isPlayerCurrentlyDead(
  player: Player,
  activeDay: number,
  activePhase: GamePhase = 'day',
): boolean {
  if (!player.death) {
    return false;
  }

  const activePhaseIndex = getPhaseIndex({ activeDay, activePhase });
  const deathPhaseIndex = getEventPhaseIndex(player.death.day, getDeathPhase(player.death));

  if (deathPhaseIndex > activePhaseIndex) {
    return false;
  }

  const revivePhaseIndex = player.revive ? getEventPhaseIndex(player.revive.day, 'day') : undefined;
  if (
    revivePhaseIndex !== undefined &&
    revivePhaseIndex <= activePhaseIndex &&
    revivePhaseIndex >= deathPhaseIndex
  ) {
    return false;
  }

  return true;
}

export function hasDeadVoteAvailable(
  player: Player,
  activeDay: number,
  activePhase: GamePhase = 'day',
  conversations?: Conversation[],
): boolean {
  if (!isPlayerCurrentlyDead(player, activeDay, activePhase)) {
    return false;
  }

  if (isDeadBanshee(player, activeDay, activePhase)) {
    return true;
  }

  if (!conversations) {
    return player.deadVoteUsed !== true;
  }

  const activePhaseIndex = getPhaseIndex({ activeDay, activePhase });

  return !conversations.some(
    (conversation) =>
      conversation.kind === 'nomination' &&
      conversation.voterIds?.includes(player.id) &&
      getEventPhaseIndex(conversation.day, 'day') <= activePhaseIndex &&
      isDeadVote(player, conversation.day) &&
      !isDeadBanshee(player, conversation.day),
  );
}

/**
 * A confirmed Banshee who is dead and wasn't executed (the Demon killed them). They may nominate
 * twice a day and vote twice on every nomination, without spending their dead vote. Any confirm
 * counts, even one logged later in the game, since the character doesn't change.
 */
export function isDeadBanshee(
  player: Player,
  activeDay: number,
  activePhase: GamePhase = 'day',
): boolean {
  if (!player.death || player.death.kind === 'execution') {
    return false;
  }

  if (!isPlayerCurrentlyDead(player, activeDay, activePhase)) {
    return false;
  }

  const confirmedRoleIds =
    getRoleAssignmentForDayOrPrevious(
      player.roleAssignments,
      Number.MAX_SAFE_INTEGER,
      'confirm',
      'night',
    )?.roleIds ?? [];
  return confirmedRoleIds.some(
    (roleId) => roleId === BANSHEE_ROLE_ID || roleId.startsWith(`${BANSHEE_ROLE_ID}_`),
  );
}

/** Nominations the player may make that day: two for a dead Banshee, otherwise one. */
export function getNominationLimit(player: Player, day: number): number {
  return isDeadBanshee(player, day) ? 2 : 1;
}

/** Votes the player's raised hand counts for on a nomination that day: two for a dead Banshee. */
export function getVoteWeight(player: Player, nominationDay: number): number {
  return isDeadBanshee(player, nominationDay) ? 2 : 1;
}

/**
 * Whether a vote on a nomination that day was cast as a dead vote: the voter died in an earlier
 * phase and wasn't revived before it. Deaths during the nomination's own day (executions end
 * the day) don't count.
 */
export function isDeadVote(player: Player, nominationDay: number): boolean {
  if (!player.death) {
    return false;
  }

  const nominationPhaseIndex = getEventPhaseIndex(nominationDay, 'day');
  const deathPhaseIndex = getEventPhaseIndex(player.death.day, getDeathPhase(player.death));
  const revivePhaseIndex = player.revive ? getEventPhaseIndex(player.revive.day, 'day') : undefined;
  const revivedBeforeVote =
    revivePhaseIndex !== undefined &&
    revivePhaseIndex >= deathPhaseIndex &&
    revivePhaseIndex <= nominationPhaseIndex;

  return deathPhaseIndex < nominationPhaseIndex && !revivedBeforeVote;
}

/** First word of the name, or the full name when another player in the game shares that first word. */
export function getPlayerTokenName(player: Player, players: Player[]): string {
  const name = normalizePlayerName(player.name);
  const firstName = getFirstName(name);
  const firstNameKey = firstName.toLocaleLowerCase();
  const isShared = players.some(
    (other) =>
      other.id !== player.id &&
      getFirstName(normalizePlayerName(other.name)).toLocaleLowerCase() === firstNameKey,
  );

  return isShared ? name : firstName;
}

function getFirstName(name: string) {
  return name.split(' ')[0] ?? '';
}

/** Players a bluff can be about: everyone but you and the Storytellers. */
export function getBluffTargetPlayers(players: Player[]): Player[] {
  return players.filter((player) => player.id !== APP_USER_ID && !player.isStoryteller);
}

/** Up to `count` different players in random order (Fisher-Yates on a copy). */
export function pickRandomPlayers(
  players: Player[],
  count: number,
  random: () => number = Math.random,
): Player[] {
  const shuffled = [...players];
  const picks = Math.min(Math.max(0, count), shuffled.length);
  for (let index = 0; index < picks; index += 1) {
    const swapIndex = index + Math.floor(random() * (shuffled.length - index));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, picks);
}
