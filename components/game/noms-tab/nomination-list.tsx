import { StyleSheet, View } from 'react-native';
import { ExecuteButton } from '@/components/game/deaths-tab/death-actions/execute-button';
import { UndoDeathButton } from '@/components/game/deaths-tab/death-actions/undo-death-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NominateButton } from '@/components/game/noms-tab/action-buttons/nominate-button';
import { DeleteNominationButton } from '@/components/game/noms-tab/delete-nomination-button';
import { EditVotesButton } from '@/components/game/noms-tab/edit-votes-button';
import { HighlightVotersButton } from '@/components/game/noms-tab/highlight-voters-button';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { VoterList } from '@/components/game/noms-tab/voter-list';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { isFlowerGirlRole } from '@/utils/role-utils';

export function NominationList() {
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const {
    activeDay,
    conversations,
    focusedPlayer,
    focusedPlayerIsDead,
    handleDeleteNomination,
    handleEditNominationVotes,
    handleToggleVoterHighlights,
    handleStartTracking,
    game,
    nominationDisabled,
    players,
    trackingMode,
    voterHighlightsActive,
    votingNominationId,
  } = useGameRouteContext();
  const playerById = new Map(players.map((player) => [player.id, player]));
  const nominations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind === 'nomination',
  );
  const voterIds = [...new Set(nominations.flatMap((nomination) => nomination.voterIds ?? []))];
  const hasFlowerGirl = game.script?.roles.some(isFlowerGirlRole) ?? false;
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
          const voterIds = nomination.voterIds ?? [];
          const nomineeId = nomination.participantIds.find(
            (playerId) => playerId !== nomination.initiatorId,
          );
          const nominee = nomineeId ? playerById.get(nomineeId) : undefined;
          const nomineeIsDead = nominee ? isPlayerCurrentlyDead(nominee, activeDay) : false;
          const nomineeWasExecuted = nomineeIsDead && nominee?.death?.kind === 'execution';
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
              </View>
              <VoterList day={nomination.day} players={players} voterIds={voterIds} />
              <View style={styles.nominationActions}>
                <EditVotesButton
                  onPress={() => handleEditNominationVotes(nomination.id, voterIds)}
                  voteCount={voterIds.length}
                />
                <View style={styles.nominationRightActions}>
                  {nominee ? (
                    nomineeWasExecuted ? (
                      <UndoDeathButton
                        compact
                        label="Unexecute"
                        onPress={() => setPlayerDeath(game.id, nominee.id, null)}
                        playerName={nominee.name}
                      />
                    ) : (
                      <ExecuteButton
                        compact
                        disabled={nomineeIsDead}
                        onPress={() =>
                          setPlayerDeath(game.id, nominee.id, {
                            day: activeDay,
                            kind: 'execution',
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        playerName={nominee.name}
                      />
                    )
                  ) : null}
                  <DeleteNominationButton onDelete={() => handleDeleteNomination(nomination.id)} />
                </View>
              </View>
            </View>
          );
        })
      )}
      {hasFlowerGirl ? (
        <HighlightVotersButton
          active={voterHighlightsActive}
          disabled={voterIds.length === 0 || !!trackingMode || !!votingNominationId}
          onPress={handleToggleVoterHighlights}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  nominationActions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nominationRightActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
});
