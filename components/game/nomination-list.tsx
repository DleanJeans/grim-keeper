import { Hand, Pencil, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';
import { NominateButton } from '@/components/game/action-buttons/nominate-button';
import { NomIcon } from '@/components/game/nom-icon';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function NominationList() {
  const {
    activeDay,
    conversations,
    focusedPlayer,
    handleDeleteNomination,
    handleEditNominationVotes,
    handleStartTracking,
    nominationDisabled,
    players,
  } = useGameRouteContext();
  const playerNames = new Map(players.map((player) => [player.id, player.name]));
  const nominations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind === 'nomination',
  );

  return (
    <View style={{ gap: 10 }}>
      {focusedPlayer ? (
        <View style={innerActionRow}>
          <NominateButton
            disabled={nominationDisabled}
            onPress={() => handleStartTracking('nomination')}
            playerName={focusedPlayer.name}
          />
        </View>
      ) : null}

      {nominations.length === 0 ? (
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
      ) : (
        nominations.map((nomination, index) => {
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
              <View style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, gap: 8 }}>
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
                  <View style={{ alignItems: 'center', flexDirection: 'row', gap: 6 }}>
                    <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                      {nominatorName}
                    </Text>
                    <NomIcon color={colors.text} size={16} />
                    <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
                      {nomineeName}
                    </Text>
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleEditNominationVotes(nomination.id, nomination.voterIds ?? [])}
                  style={({ pressed }) => ({
                    alignItems: 'center',
                    backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
                    borderColor: colors.border,
                    borderRadius: 8,
                    borderWidth: 1,
                    flexDirection: 'row',
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  })}
                >
                  <Pencil color={colors.text} size={15} strokeWidth={2.6} />
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>Votes</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    Alert.alert('Delete nomination?', 'This removes the nomination and votes.', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDeleteNomination(nomination.id),
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
              <View>
                <Text
                  selectable
                  style={{ color: colors.textMuted, fontSize: 14, gap: 8, lineHeight: 20 }}
                >
                  <Hand color={colors.textMuted} size={12} />{' '}
                  {voterNames.length > 0 ? voterNames.join(', ') : 'No votes recorded'} (
                  {voterNames.length})
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
