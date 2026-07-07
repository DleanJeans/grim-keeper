import { Podcast, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';

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
  const groupRepeats = buildConversationGroupRepeats(conversations, activeDay);

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
        const repeat = groupRepeats.get(getConversationGroupKey(conversation));

        return (
          <View
            key={conversation.id}
            style={{
              backgroundColor: repeat?.repeated ? '#422006' : colors.surface,
              borderColor: repeat?.repeated ? '#f59e0b' : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              gap: 12,
              padding: 10,
              paddingLeft: 20,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: 12 }}>
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
              <View style={{ flex: 1, gap: 6, flexDirection: 'row' }}>
                <Text
                  selectable
                  style={{ color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 21 }}
                >
                  {initiatorName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Podcast color={colors.textMuted} size={14} />
                  <Text
                    selectable
                    style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
                  >
                    {talkedToNames.join(', ')}
                  </Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  Alert.alert('Delete interaction?', 'This removes the recorded conversation.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => onDeleteConversation(conversation.id),
                    },
                  ])
                }
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.surfacePressed : colors.dangerSurface,
                  borderColor: colors.danger,
                  borderRadius: 8,
                  borderWidth: 1,
                  flexDirection: 'row',
                  gap: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                })}
              >
                <Trash2 color={colors.danger} size={15} strokeWidth={2.6} />
              </Pressable>
            </View>
            {repeat?.repeated ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {repeat.dayLabels.map((label) => (
                  <View
                    key={label}
                    style={{
                      backgroundColor: '#78350f',
                      borderColor: '#f59e0b',
                      borderRadius: 999,
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: '#fde68a',
                        fontSize: 12,
                        fontWeight: '900',
                        lineHeight: 16,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
                <View
                  style={{
                    backgroundColor: '#78350f',
                    borderColor: '#f59e0b',
                    borderRadius: 999,
                    borderWidth: 1,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    selectable
                    style={{
                      color: '#fde68a',
                      fontSize: 12,
                      fontWeight: '900',
                      lineHeight: 16,
                    }}
                  >
                    x{repeat.dayCount}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
