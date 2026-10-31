import type { Game, PlayerRoleAssignment } from '@/types/game';

/** A new nomination without votes yet: its votes come next, so undo covers both. */
export const PENDING_CHANGE = 'pending';

const ASSIGNMENT_LABELS: Record<PlayerRoleAssignment['kind'], string> = {
  claim: 'Claim saved',
  confirm: 'Character confirmed',
  guess: 'Guess saved',
  rumor: 'Rumor saved',
};

/**
 * What an edit changed that is worth an Undo button: deaths, revives, nominations and votes, or
 * claims and other character assignments. Undefined for anything else, such as notes.
 */
export function describeGameChange(
  before: Pick<Game, 'conversations' | 'players'>,
  after: Pick<Game, 'conversations' | 'players'>,
): string | undefined {
  const beforePlayers = new Map(before.players.map((player) => [player.id, player]));
  for (const player of after.players) {
    const previous = beforePlayers.get(player.id);
    if (!previous) continue;
    if (player.death !== previous.death) {
      return player.death ? 'Death recorded' : 'Death removed';
    }
    if (player.revive !== previous.revive) {
      return player.revive ? 'Revive recorded' : 'Revive removed';
    }
  }

  const beforeNominations = new Map(
    before.conversations
      .filter((conversation) => conversation.kind === 'nomination')
      .map((conversation) => [conversation.id, conversation]),
  );
  const afterNominations = after.conversations.filter(
    (conversation) => conversation.kind === 'nomination',
  );
  for (const nomination of afterNominations) {
    const previous = beforeNominations.get(nomination.id);
    if (!previous) {
      return nomination.voterIds?.length ? 'Nomination saved' : PENDING_CHANGE;
    }
    if (previous.voterIds !== nomination.voterIds) return 'Votes saved';
  }
  if (afterNominations.length < beforeNominations.size) return 'Nomination deleted';

  for (const player of after.players) {
    const previous = beforePlayers.get(player.id);
    if (!previous || previous.roleAssignments === player.roleAssignments) continue;
    const changed =
      (player.roleAssignments ?? []).find(
        (assignment) => !(previous.roleAssignments ?? []).includes(assignment),
      ) ??
      (previous.roleAssignments ?? []).find(
        (assignment) => !(player.roleAssignments ?? []).includes(assignment),
      );
    return changed ? ASSIGNMENT_LABELS[changed.kind] : 'Character saved';
  }

  return undefined;
}
