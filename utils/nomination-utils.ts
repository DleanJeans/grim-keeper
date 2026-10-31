import type { Conversation, Player } from '@/types/game';
import { isDeadVote } from '@/utils/player-utils';

/** Players alive when the day began, not counting Storytellers. Same-day deaths still count. */
export function getAlivePlayerCount(players: Player[], day: number): number {
  return players.filter((player) => !player.isStoryteller && !isDeadVote(player, day)).length;
}

/** Votes needed to put a nominee on the block: half the living players, rounded up. */
export function getVotesToExecute(players: Player[], day: number): number {
  return Math.ceil(getAlivePlayerCount(players, day) / 2);
}

/**
 * The nomination that would be executed if the day ended now: the one with the most votes,
 * at least the votes needed and no tie for the most votes.
 */
export function getOnTheBlockNominationId(
  nominations: Conversation[],
  players: Player[],
  day: number,
): string | undefined {
  const votesNeeded = getVotesToExecute(players, day);
  let topId: string | undefined;
  let topVotes = 0;
  let tied = false;

  for (const nomination of nominations) {
    const votes = nomination.voterIds?.length ?? 0;
    if (votes > topVotes) {
      topId = nomination.id;
      topVotes = votes;
      tied = false;
    } else if (votes === topVotes) {
      tied = true;
    }
  }

  return topId && !tied && topVotes >= votesNeeded ? topId : undefined;
}
