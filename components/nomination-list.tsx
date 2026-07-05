import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';

type NominationListProps = {
  activeDay: number;
  conversations: Conversation[];
  players: Player[];
};

export function NominationList({ activeDay, conversations, players }: NominationListProps) {
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const nominations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind === 'nomination',
  );

  if (nominations.length === 0) {
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
          No nominations logged for Day {activeDay}.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {nominations.map((nomination, index) => {
        const nominatorName = playerNames.get(nomination.initiatorId) ?? 'Unknown';
        const nomineeId = nomination.participantIds.find(
          (playerId) => playerId !== nomination.initiatorId,
        );
        const nomineeName = nomineeId ? (playerNames.get(nomineeId) ?? 'Unknown') : 'Unknown';
        const voterNames = (nomination.voterIds ?? []).map(
          (playerId) => playerNames.get(playerId) ?? 'Unknown',
        );

        return (
          <View
            key={nomination.id}
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              gap: 8,
              padding: 14,
            }}
          >
            <Text
              selectable
              style={{
                color: colors.textMuted,
                fontSize: 13,
                fontVariant: ['tabular-nums'],
                fontWeight: '800',
              }}
            >
              Nomination {index + 1}
            </Text>
            <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
              {nominatorName} nominated {nomineeName}
            </Text>
            <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
              Voted: {voterNames.length > 0 ? voterNames.join(', ') : 'No votes recorded'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
