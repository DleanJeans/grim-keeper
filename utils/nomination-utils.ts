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

/**
 * Days left, counting today, if someone is executed every day and the Demon kills every night:
 * each day and night removes two players and evil wins at two alive.
 */
export function getDaysLeft(alivePlayerCount: number): number {
  return Math.max(0, Math.ceil((alivePlayerCount - 2) / 2));
}

export type PlayerNominationDay = {
  day: number;
  /** Nominees this player nominated. */
  nominated: string[];
  /** Players who nominated this player. */
  nominatedBy: string[];
  /** Nominees this player voted for. */
  votedFor: string[];
  /** Nominees this player didn't vote for, not counting their own nominations of themselves. */
  didNotVoteFor: string[];
};

/** Each day up to `lastDay` with nominations, from one player's side, newest first. */
export function getPlayerNominationHistory(
  conversations: Conversation[],
  players: Player[],
  playerId: string,
  lastDay: number,
): PlayerNominationDay[] {
  const nameOf = (id: string | undefined) =>
    players.find((player) => player.id === id)?.name ?? 'Unknown';
  const byDay = new Map<number, PlayerNominationDay>();

  for (const nomination of conversations) {
    if (nomination.kind !== 'nomination' || nomination.day > lastDay) continue;
    const nomineeId = nomination.participantIds.find((id) => id !== nomination.initiatorId);
    const entry = byDay.get(nomination.day) ?? {
      day: nomination.day,
      didNotVoteFor: [],
      nominated: [],
      nominatedBy: [],
      votedFor: [],
    };
    const nominee = nameOf(nomineeId);
    if (nomination.initiatorId === playerId) entry.nominated.push(nominee);
    if (nomineeId === playerId) entry.nominatedBy.push(nameOf(nomination.initiatorId));
    if (nomination.voterIds?.includes(playerId)) entry.votedFor.push(nominee);
    else if (nomineeId !== playerId) entry.didNotVoteFor.push(nominee);
    byDay.set(nomination.day, entry);
  }

  return [...byDay.values()].sort((a, b) => b.day - a.day);
}

export type VotingBuddy = {
  /** Nominations where both voted the same way. */
  agreed: number;
  player: Player;
  /** Nominations both could vote on. */
  total: number;
};

/** Fewest shared nominations before a voting match counts. */
const MIN_SHARED_NOMINATIONS = 2;

/**
 * Players who voted the same way as `playerId` (both for, or both not) most often up to
 * `lastDay`, best match first. Storytellers and players with too few shared votes are left out.
 */
export function getVotingBuddies(
  conversations: Conversation[],
  players: Player[],
  playerId: string,
  lastDay: number,
): VotingBuddy[] {
  const nominations = conversations.filter(
    (conversation) => conversation.kind === 'nomination' && conversation.day <= lastDay,
  );

  return players
    .filter((player) => player.id !== playerId && !player.isStoryteller)
    .map((player) => {
      let agreed = 0;
      let total = 0;
      for (const nomination of nominations) {
        // Nominees rarely vote on themselves, so their nomination says little.
        const nomineeId = nomination.participantIds.find((id) => id !== nomination.initiatorId);
        if (nomineeId === playerId || nomineeId === player.id) continue;
        const voters = nomination.voterIds ?? [];
        total += 1;
        if (voters.includes(playerId) === voters.includes(player.id)) agreed += 1;
      }
      return { agreed, player, total };
    })
    .filter((buddy) => buddy.total >= MIN_SHARED_NOMINATIONS)
    .sort((a, b) => b.agreed / b.total - a.agreed / a.total || b.total - a.total);
}

export type NominationAvailability = {
  /** Living players who haven't nominated today. */
  canNominate: Player[];
  /** Players nobody has nominated today. */
  notNominated: Player[];
};

/** Who may still nominate and who hasn't been nominated, by the usual one-each rule. */
export function getNominationAvailability(
  players: Player[],
  nominations: Conversation[],
  day: number,
): NominationAvailability {
  const todays = nominations.filter(
    (nomination) => nomination.kind === 'nomination' && nomination.day === day,
  );
  const nominatorIds = new Set(todays.map((nomination) => nomination.initiatorId));
  const nomineeIds = new Set(
    todays.map(
      (nomination) =>
        nomination.participantIds.find((id) => id !== nomination.initiatorId) ??
        nomination.initiatorId,
    ),
  );
  const playing = players.filter((player) => !player.isStoryteller);
  return {
    canNominate: playing.filter(
      (player) => !isDeadVote(player, day) && !nominatorIds.has(player.id),
    ),
    notNominated: playing.filter((player) => !nomineeIds.has(player.id)),
  };
}
