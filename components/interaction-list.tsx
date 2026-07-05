import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';

type InteractionListProps = {
  activeDay: number;
  conversations: Conversation[];
  players: Player[];
  onDeleteConversation: (conversationId: string) => void;
};

export function InteractionList({
  activeDay,
  conversations,
  onDeleteConversation,
  players,
}: InteractionListProps) {
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const activeDayConversations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind !== 'nomination',
  );

  if (activeDayConversations.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: 8,
          borderWidth: 1,
          padding: 16,
        }}
      >
        <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 21 }}>
          No interactions logged for Day {activeDay}.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {activeDayConversations.map((conversation, index) => {
        const initiatorName = playerNames.get(conversation.initiatorId) ?? 'Unknown';
        const talkedToNames = conversation.participantIds
          .filter((playerId) => playerId !== conversation.initiatorId)
          .map((playerId) => playerNames.get(playerId) ?? 'Unknown');

        return (
          <View
            key={conversation.id}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              gap: 12,
              padding: 14,
            }}
          >
            <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 12 }}>
              <Text
                selectable
                style={{
                  color: colors.textMuted,
                  fontSize: 14,
                  fontVariant: ['tabular-nums'],
                  fontWeight: '800',
                  width: 28,
                }}
              >
                {index + 1}.
              </Text>
              <View style={{ flex: 1, gap: 6 }}>
                <Text
                  selectable
                  style={{ color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 21 }}
                >
                  {initiatorName}
                </Text>
                <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                  Talked to {talkedToNames.join(', ')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => onDeleteConversation(conversation.id)}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? colors.surfacePressed : colors.dangerSurface,
                  borderColor: colors.danger,
                  borderRadius: 8,
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                })}
              >
                <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '800' }}>
                  Delete
                </Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}
