import type { Game } from '@/types/game';
import { mapRoleInfoPlayerIds } from '@/utils/role-info-utils';

/**
 * The game with one player replaced by another friend. The new friend takes over the seat, role,
 * claims, deaths, votes, nominations, links, notes and marks, so every reference to the old
 * player id points at the new one. Returns the game untouched when the swap is not possible: the
 * new friend is already in the game or the player is not.
 */
export function swapGamePlayer(
  game: Game,
  playerId: string,
  friend: { id: string; name: string },
): Game {
  if (
    playerId === friend.id ||
    !game.players.some((player) => player.id === playerId) ||
    game.players.some((player) => player.id === friend.id)
  ) {
    return game;
  }

  const mapId = (id: string) => (id === playerId ? friend.id : id);
  const mapOptionalId = (id: string | undefined) => (id === undefined ? undefined : mapId(id));
  const mapKeys = <T>(record: Record<string, T> | undefined) =>
    record && Object.fromEntries(Object.entries(record).map(([key, value]) => [mapId(key), value]));

  return {
    ...game,
    updatedAt: new Date().toISOString(),
    players: game.players.map((player) => ({
      ...player,
      ...(player.id === playerId ? { id: friend.id, name: friend.name } : {}),
      death: player.death && {
        ...player.death,
        ...(player.death.killerPlayerId !== undefined
          ? { killerPlayerId: mapId(player.death.killerPlayerId) }
          : {}),
        ...(player.death.killerPlayerIds
          ? { killerPlayerIds: player.death.killerPlayerIds.map(mapId) }
          : {}),
      },
      roleAssignments: player.roleAssignments?.map((assignment) => ({
        ...assignment,
        ...(assignment.subjectPlayerId !== undefined
          ? { subjectPlayerId: mapId(assignment.subjectPlayerId) }
          : {}),
      })),
    })),
    conversations: game.conversations.map((conversation) => ({
      ...conversation,
      bigWigPlayerId: mapOptionalId(conversation.bigWigPlayerId),
      initiatorId: mapId(conversation.initiatorId),
      participantIds: conversation.participantIds.map(mapId),
      voterIds: conversation.voterIds?.map(mapId),
    })),
    playerDayNotes: game.playerDayNotes?.map((entry) => ({
      ...entry,
      playerId: mapId(entry.playerId),
    })),
    roleInfos: mapRoleInfoPlayerIds(game.roleInfos, mapId),
    suspicions: game.suspicions && swapSuspicionKeys(game.suspicions, mapId),
    tokenLabels: mapKeys(game.tokenLabels),
    theories: game.theories?.map((theory) => ({
      ...theory,
      evilPlayerIds: theory.evilPlayerIds.map(mapId),
    })),
    fakeEvilTeam: game.fakeEvilTeam && {
      ...game.fakeEvilTeam,
      demonId: mapOptionalId(game.fakeEvilTeam.demonId),
      minionIds: game.fakeEvilTeam.minionIds.map(mapId),
      redHerringId: mapOptionalId(game.fakeEvilTeam.redHerringId),
    },
    knavesLiarId: mapOptionalId(game.knavesLiarId),
  };
}

/** Suspicion keys are `<phase index>:<player id>`. */
function swapSuspicionKeys(marks: Record<string, string>, mapId: (id: string) => string) {
  return Object.fromEntries(
    Object.entries(marks).map(([key, value]) => {
      const separator = key.indexOf(':');
      return [`${key.slice(0, separator + 1)}${mapId(key.slice(separator + 1))}`, value];
    }),
  );
}
