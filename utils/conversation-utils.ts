import type { Conversation, ConversationGroupRepeat, ConversationRow, Player } from '@/types/game';

export function normalizePlayerName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

export function hasDuplicatePlayerName(names: string[], candidate: string) {
  const normalized = normalizePlayerName(candidate).toLocaleLowerCase();

  if (!normalized) {
    return false;
  }

  return names.some((name) => normalizePlayerName(name).toLocaleLowerCase() === normalized);
}

export function getConversationPairs(conversation: Conversation) {
  const pairs = new Set<string>();

  for (let index = 0; index < conversation.participantIds.length; index += 1) {
    for (
      let nextIndex = index + 1;
      nextIndex < conversation.participantIds.length;
      nextIndex += 1
    ) {
      pairs.add(
        getPairKey(conversation.participantIds[index], conversation.participantIds[nextIndex]),
      );
    }
  }

  return pairs;
}

export function getPairKey(firstPlayerId: string, secondPlayerId: string) {
  return [firstPlayerId, secondPlayerId].sort().join(':');
}

export function getConversationGroupKey(conversation: Conversation) {
  return [...new Set(conversation.participantIds)].sort().join(':');
}

export function buildConversationGroupRepeats(
  conversations: Conversation[],
  activeDay: number,
): Map<string, ConversationGroupRepeat> {
  const groupDays = new Map<string, Set<number>>();

  for (const conversation of conversations) {
    if (conversation.kind === 'nomination') {
      continue;
    }

    const groupKey = getConversationGroupKey(conversation);

    if (!groupDays.has(groupKey)) {
      groupDays.set(groupKey, new Set());
    }

    groupDays.get(groupKey)?.add(conversation.day);
  }

  const groupRepeats = new Map<string, ConversationGroupRepeat>();

  for (const [groupKey, days] of groupDays) {
    const sortedDays = [...days]
      .filter((day) => day <= activeDay)
      .sort((first, second) => first - second);
    const priorDays = sortedDays.filter((day) => day < activeDay);

    groupRepeats.set(groupKey, {
      dayLabels: priorDays.map((day) => `D${day}`),
      dayCount: sortedDays.length,
      repeated: sortedDays.length > 1,
    });
  }

  return groupRepeats;
}

export function buildConversationRows(
  players: Player[],
  conversations: Conversation[],
  activeDay: number,
): ConversationRow[] {
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const priorPairs = new Set<string>();
  const currentTalkedTo = new Map<string, Set<string>>();
  const currentRepeated = new Map<string, Set<string>>();

  for (const conversation of conversations) {
    if (conversation.kind === 'nomination') {
      continue;
    }

    if (conversation.day >= activeDay) {
      continue;
    }

    for (const pair of getConversationPairs(conversation)) {
      priorPairs.add(pair);
    }
  }

  for (const conversation of conversations) {
    if (conversation.kind === 'nomination') {
      continue;
    }

    if (conversation.day !== activeDay) {
      continue;
    }

    for (const playerId of conversation.participantIds) {
      if (!currentTalkedTo.has(playerId)) {
        currentTalkedTo.set(playerId, new Set());
      }

      if (!currentRepeated.has(playerId)) {
        currentRepeated.set(playerId, new Set());
      }
    }

    for (let index = 0; index < conversation.participantIds.length; index += 1) {
      const playerId = conversation.participantIds[index];

      for (const otherPlayerId of conversation.participantIds) {
        if (otherPlayerId === playerId) {
          continue;
        }

        currentTalkedTo.get(playerId)?.add(otherPlayerId);

        if (priorPairs.has(getPairKey(playerId, otherPlayerId))) {
          currentRepeated.get(playerId)?.add(otherPlayerId);
        }
      }
    }
  }

  return [...players]
    .sort((first, second) => first.seat - second.seat)
    .map((player) => {
      const talkedToIds = [...(currentTalkedTo.get(player.id) ?? [])].sort(
        (firstId, secondId) => getSeat(players, firstId) - getSeat(players, secondId),
      );

      return {
        playerId: player.id,
        playerName: player.name,
        talkedTo: talkedToIds.map((playerId) => playerNames.get(playerId) ?? 'Unknown'),
        talkedToIds,
        repeatedPlayerIds: [...(currentRepeated.get(player.id) ?? [])],
      };
    });
}

function getSeat(players: Player[], playerId: string) {
  return players.find((player) => player.id === playerId)?.seat ?? Number.MAX_SAFE_INTEGER;
}
