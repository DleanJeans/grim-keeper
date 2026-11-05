import { StyleSheet, View } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { HighlightVotersButton } from '@/components/game/noms-tab/highlight-voters-button';
import { NominationAvailability } from '@/components/game/noms-tab/nomination-availability';
import { NominationRow } from '@/components/game/noms-tab/nomination-row';
import { PlayerNominationHistory } from '@/components/game/noms-tab/player-nomination-history';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getOnTheBlockNominationId, getVotesToExecute } from '@/utils/nomination-utils';
import { getRolesByIds, isFlowerGirlRole } from '@/utils/role-utils';

export function NominationList() {
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const setNominationBigWig = useGameStore((state) => state.setNominationBigWig);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const {
    activeDay,
    activeDayCutoff,
    activePhase,
    conversations,
    handleDeleteNomination,
    handleEditNominationVotes,
    handleToggleVoterHighlights,
    runDayEdit,
    game,
    players,
    trackingMode,
    voterHighlightsActive,
    votingNominationId,
  } = useGameRouteContext();
  const nominations = conversations.filter(
    (conversation) => conversation.day === activeDayCutoff && conversation.kind === 'nomination',
  );
  const votesNeeded = getVotesToExecute(players, activeDayCutoff);
  const onTheBlockId = getOnTheBlockNominationId(nominations, players, activeDayCutoff);
  const voterIds = [...new Set(nominations.flatMap((nomination) => nomination.voterIds ?? []))];
  const hasFlowerGirl = game.script?.roles.some(isFlowerGirlRole) ?? false;
  const bigWig = getRolesByIds(game.lorics ?? [], roleCatalog).find((role) => role.id === 'bigwig');

  return (
    <View style={styles.list}>
      {activePhase === 'day' && activeDayCutoff >= 1 && !trackingMode && !votingNominationId ? (
        <NominationAvailability day={activeDayCutoff} nominations={nominations} players={players} />
      ) : null}
      {nominations.length === 0 ? (
        <View style={styles.empty}>
          <Text selectable style={styles.emptyText}>
            {activeDayCutoff < 1
              ? 'No nominations logged before Day 1.'
              : `No nominations logged for Day ${activeDayCutoff}.`}
          </Text>
        </View>
      ) : (
        nominations.map((nomination, index) => (
          <NominationRow
            activeDay={activeDay}
            activePhase={activePhase}
            bigWig={bigWig}
            index={index}
            key={nomination.id}
            nomination={nomination}
            onDelete={() => handleDeleteNomination(nomination.id)}
            onEditVotes={(nominationVoterIds) =>
              handleEditNominationVotes(nomination.id, nominationVoterIds)
            }
            onExecute={(nominee) =>
              runDayEdit(() =>
                setPlayerDeath(game.id, nominee.id, {
                  day: activeDay,
                  kind: 'execution',
                  updatedAt: new Date().toISOString(),
                }),
              )
            }
            onKillBigWig={(player, role) =>
              runDayEdit(() =>
                setPlayerDeath(game.id, player.id, {
                  day: activeDay,
                  killerRoleIds: [role.id],
                  kind: 'night',
                  phase: 'day',
                  updatedAt: new Date().toISOString(),
                }),
              )
            }
            onSelectBigWig={(playerId) =>
              runDayEdit(() => setNominationBigWig(game.id, nomination.id, playerId))
            }
            onUndoExecution={(nominee) =>
              runDayEdit(() => setPlayerDeath(game.id, nominee.id, null))
            }
            onTheBlock={nomination.id === onTheBlockId}
            players={players}
            votesNeeded={votesNeeded}
          />
        ))
      )}
      <PlayerNominationHistory />
      {activePhase === 'day' && hasFlowerGirl ? (
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
