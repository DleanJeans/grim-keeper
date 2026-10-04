import type { Conversation, GamePhase, Player } from '@/types/game';
import { getEventPhaseIndex, getPhaseIndex } from '@/utils/game-phase-utils';

export function isPlayerCurrentlyDead(
  player: Player,
  activeDay: number,
  activePhase: GamePhase = 'day',
): boolean {
  if (!player.death) {
    return false;
  }

  const activePhaseIndex = getPhaseIndex({ activeDay, activePhase });
  const deathPhaseIndex = getEventPhaseIndex(
    player.death.day,
    player.death.kind === 'night' ? 'night' : 'day',
  );

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
  const deathPhaseIndex = getEventPhaseIndex(
    player.death.day,
    player.death.kind === 'night' ? 'night' : 'day',
  );
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
