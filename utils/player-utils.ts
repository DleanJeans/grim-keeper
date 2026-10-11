import type { Conversation, GamePhase, Player } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getDeathPhase, getEventPhaseIndex, getPhaseIndex } from '@/utils/game-phase-utils';

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

  if (!conversations || !player.death) {
    return player.deadVoteUsed !== true;
  }

  const activePhaseIndex = getPhaseIndex({ activeDay, activePhase });
  const deathPhaseIndex = getEventPhaseIndex(player.death.day, getDeathPhase(player.death));
  const revivePhaseIndex = player.revive ? getEventPhaseIndex(player.revive.day, 'day') : undefined;

  return !conversations.some((conversation) => {
    if (conversation.kind !== 'nomination' || !conversation.voterIds?.includes(player.id)) {
      return false;
    }

    const nominationPhaseIndex = getEventPhaseIndex(conversation.day, 'day');
    const revivedBeforeVote =
      revivePhaseIndex !== undefined &&
      revivePhaseIndex >= deathPhaseIndex &&
      revivePhaseIndex <= nominationPhaseIndex;

    return (
      deathPhaseIndex < nominationPhaseIndex &&
      nominationPhaseIndex <= activePhaseIndex &&
      !revivedBeforeVote
    );
  });
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
