import { Hand, Pencil, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { NominateButton } from '@/components/game/action-buttons/nominate-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NomIcon } from '@/components/game/nom-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function NominationList() {
  const {
    activeDay,
    conversations,
    focusedPlayer,
    focusedPlayerIsDead,
    handleDeleteNomination,
    handleEditNominationVotes,
    handleStartTracking,
    nominationDisabled,
    players,
    trackingMode,
    votingNominationId,
  } = useGameRouteContext();
  const playerById = new Map(players.map((player) => [player.id, player]));
  const nominations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind === 'nomination',
  );
  const focusedPlayerNomination = focusedPlayer
    ? nominations.find((nomination) => nomination.initiatorId === focusedPlayer.id)
    : undefined;
  const focusedPlayerNomineeId = focusedPlayerNomination
    ? focusedPlayerNomination.participantIds.find(
        (playerId) => playerId !== focusedPlayerNomination.initiatorId,
      )
    : undefined;
  const focusedPlayerNomineeName = focusedPlayerNomineeId
    ? (playerById.get(focusedPlayerNomineeId)?.name ?? 'Unknown')
    : undefined;
  const focusedPlayerNominee = focusedPlayerNomineeId
    ? playerById.get(focusedPlayerNomineeId)
    : undefined;

  return (
    <View style={{ gap: 10 }}>
      {focusedPlayer && !trackingMode && !votingNominationId ? (
        <View style={innerActionRow}>
          <NominateButton
            alreadyNominatedName={focusedPlayerNomineeName}
            alreadyNominatedPlayer={focusedPlayerNominee}
            dead={focusedPlayerIsDead}
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
          const nominator = playerById.get(nomination.initiatorId);
          const nomineeId = nomination.participantIds.find(
            (playerId) => playerId !== nomination.initiatorId,
          );
          const nominee = nomineeId ? playerById.get(nomineeId) : undefined;
          const voterPlayers = (nomination.voterIds ?? []).map((playerId) => ({
            playerId,
            player: playerById.get(playerId),
          }));

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
                    {nominator ? (
                      <PlayerNameWithRole
                        player={nominator}
                        textStyle={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
                      />
                    ) : (
                      <Text
                        selectable
                        style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
                      >
                        Unknown
                      </Text>
                    )}
                    <NomIcon color={colors.text} size={16} />
                    {nominee ? (
                      <PlayerNameWithRole
                        player={nominee}
                        textStyle={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
                      />
                    ) : (
                      <Text
                        selectable
                        style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}
                      >
                        Unknown
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    handleEditNominationVotes(nomination.id, nomination.voterIds ?? [])
                  }
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
              <View
                style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}
              >
                <Hand color={colors.textMuted} size={12} />
                {voterPlayers.length > 0 ? (
                  voterPlayers.map(({ playerId, player }) =>
                    player ? (
                      <PlayerNameWithRole
                        key={player.id}
                        player={player}
                        roleIconSize={14}
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
                ) : (
                  <Text
                    selectable
                    style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
                  >
                    No votes recorded
                  </Text>
                )}
                <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
                  ({voterPlayers.length})
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
