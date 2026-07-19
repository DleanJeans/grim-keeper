import { MessagesSquare, Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
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
  const showDialog = useAppDialog();
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
      {visibleConversations.map((conversation) => {
        const dayIndex = activeDayConversations.findIndex((c) => c.id === conversation.id);
        const initiator = playerById.get(conversation.initiatorId);
        const talkedToPlayers = conversation.participantIds
          .filter((playerId) => playerId !== conversation.initiatorId)
          .map((playerId) => ({ playerId, player: playerById.get(playerId) }));
        const repeat = groupRepeats.get(getConversationGroupKey(conversation));

        return (
          <View
            key={conversation.id}
            style={{
              backgroundColor: repeat?.repeated ? '#422006' : colors.surface,
              borderColor: repeat?.repeated ? '#f59e0b' : colors.border,
              borderRadius: 8,
              borderWidth: 1,
              gap: 6,
              padding: 10,
              paddingLeft: 20,
            }}
          >
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
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
                {dayIndex + 1}.
              </Text>
              <View style={{ flex: 1, gap: 6, flexDirection: 'row' }}>
                {initiator ? (
                  <PlayerNameWithRole
                    player={initiator}
                    textStyle={{
                      color: colors.text,
                      fontSize: 16,
                      fontWeight: '800',
                      lineHeight: 21,
                    }}
                  />
                ) : (
                  <Text
                    selectable
                    style={{ color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 21 }}
                  >
                    Unknown
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MessagesSquare color={colors.textMuted} size={14} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, flexShrink: 1 }}>
                    {talkedToPlayers.length === 0 ? (
                      <Text
                        selectable
                        style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
                      >
                        Unknown
                      </Text>
                    ) : (
                      talkedToPlayers.map(({ playerId, player }) =>
                        player ? (
                          <PlayerNameWithRole
                            key={player.id}
                            bordered
                            player={player}
                            roleIconSize={20}
                            textStyle={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
                          />
                        ) : (
                          <Text
                            key={playerId}
                            selectable
                            style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
                          >
                            Unknown
                          </Text>
                        ),
                      )
                    )}
                  </View>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() =>
                  showDialog('Delete interaction?', 'This removes the recorded conversation.', [
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
