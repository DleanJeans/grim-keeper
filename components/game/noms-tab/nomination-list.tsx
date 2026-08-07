import { View } from 'react-native';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NominateButton } from '@/components/game/noms-tab/action-buttons/nominate-button';
import { HighlightVotersButton } from '@/components/game/noms-tab/highlight-voters-button';
import { NominationRow } from '@/components/game/noms-tab/nomination-row';
import { innerActionRow } from '@/components/game/styles';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getRolesByIds, isFlowerGirlRole } from '@/utils/role-utils';

export function NominationList() {
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const setNominationBigWig = useGameStore((state) => state.setNominationBigWig);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
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
  const bigWig = getRolesByIds(game.lorics ?? [], roleCatalog).find((role) => role.id === 'bigwig');
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
        nominations.map((nomination, index) => (
          <NominationRow
            activeDay={activeDay}
            bigWig={bigWig}
            index={index}
            key={nomination.id}
            nomination={nomination}
            onDelete={() => handleDeleteNomination(nomination.id)}
            onEditVotes={(nominationVoterIds) =>
              handleEditNominationVotes(nomination.id, nominationVoterIds)
            }
            onExecute={(nominee) =>
              setPlayerDeath(game.id, nominee.id, {
                day: activeDay,
                kind: 'execution',
                updatedAt: new Date().toISOString(),
              })
            }
            onKillBigWig={(player, role) =>
              setPlayerDeath(game.id, player.id, {
                day: activeDay,
                killerRoleIds: [role.id],
                kind: 'night',
                updatedAt: new Date().toISOString(),
              })
            }
            onSelectBigWig={(playerId) => setNominationBigWig(game.id, nomination.id, playerId)}
            onUndoExecution={(nominee) => setPlayerDeath(game.id, nominee.id, null)}
            players={players}
          />
        ))
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
