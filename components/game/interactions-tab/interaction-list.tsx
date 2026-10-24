import { StyleSheet, View } from 'react-native';

import { InteractionCard } from '@/components/game/interactions-tab/interaction-card';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';

type InteractionListProps = {
  activeDay: number;
  conversations: Conversation[];
  onDeleteConversation: (conversationId: string) => void;
  players: Player[];
  selectedPlayerId?: string | null;
};

export function InteractionList({
  activeDay,
  conversations,
  onDeleteConversation,
  players,
  selectedPlayerId = null,
}: InteractionListProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const activeDayConversations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind !== 'nomination',
  );
  const visibleConversations = selectedPlayerId
    ? activeDayConversations.filter(
        (conversation) =>
          conversation.initiatorId === selectedPlayerId ||
          conversation.participantIds.includes(selectedPlayerId),
      )
    : activeDayConversations;
  const groupRepeats = buildConversationGroupRepeats(conversations, activeDay);

  if (visibleConversations.length === 0) {
    return (
      <View style={styles.empty}>
        <Text selectable style={styles.emptyText}>
          {activeDay < 1
            ? 'No interactions logged before Day 1.'
            : `No interactions logged for Day ${activeDay}.`}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {visibleConversations.map((conversation) => {
        const repeat = groupRepeats.get(getConversationGroupKey(conversation));

        return (
          <InteractionCard
            conversation={conversation}
            key={conversation.id}
            number={activeDayConversations.indexOf(conversation) + 1}
            onDelete={onDeleteConversation}
            playerById={playerById}
            repeat={repeat?.repeated ? repeat : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  list: {
    gap: 10,
  },
});
