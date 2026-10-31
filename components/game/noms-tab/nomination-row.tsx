import { StyleSheet, View } from 'react-native';

import { ExecuteButton } from '@/components/game/deaths-tab/death-actions/execute-button';
import { UndoDeathButton } from '@/components/game/deaths-tab/death-actions/undo-death-button';
import { BigWigPlayerPicker } from '@/components/game/noms-tab/big-wig-player-picker';
import { DeleteNominationButton } from '@/components/game/noms-tab/delete-nomination-button';
import { EditVotesButton } from '@/components/game/noms-tab/edit-votes-button';
import { KillBigWigButton } from '@/components/game/noms-tab/kill-big-wig-button';
import { NominationPlayers } from '@/components/game/noms-tab/nomination-players';
import { VoterList } from '@/components/game/noms-tab/voter-list';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, GamePhase, Player, Role } from '@/types/game';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

type NominationRowProps = {
  activeDay: number;
  activePhase: GamePhase;
  bigWig?: Role;
  index: number;
  nomination: Conversation;
  onDelete: () => void;
  onEditVotes: (voterIds: string[]) => void;
  onExecute: (player: Player) => void;
  onKillBigWig: (player: Player, bigWig: Role) => void;
  onSelectBigWig: (playerId?: string) => void;
  onUndoExecution: (player: Player) => void;
  /** This nominee has the most votes and enough of them to be executed. */
  onTheBlock: boolean;
  players: Player[];
  votesNeeded: number;
};

export function NominationRow({
  activeDay,
  activePhase,
  bigWig,
  index,
  nomination,
  onDelete,
  onEditVotes,
  onExecute,
  onKillBigWig,
  onSelectBigWig,
  onUndoExecution,
  onTheBlock,
  players,
  votesNeeded,
}: NominationRowProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const nominator = playerById.get(nomination.initiatorId);
  const voterIds = nomination.voterIds ?? [];
  const nomineeId = nomination.participantIds.find(
    (playerId) => playerId !== nomination.initiatorId,
  );
  const nominee = nomineeId ? playerById.get(nomineeId) : undefined;
  const selectedBigWigPlayer = nomination.bigWigPlayerId
    ? playerById.get(nomination.bigWigPlayerId)
    : undefined;
  const nomineeIsDead = nominee ? isPlayerCurrentlyDead(nominee, activeDay, activePhase) : false;
  const nomineeWasExecuted = nomineeIsDead && nominee?.death?.kind === 'execution';
  const selectedBigWigPlayerIsDead = selectedBigWigPlayer
    ? isPlayerCurrentlyDead(selectedBigWigPlayer, activeDay, activePhase)
    : false;

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Text selectable style={styles.label}>
            Nomination {index + 1}
          </Text>
          {onTheBlock ? <OnTheBlockBadge /> : null}
        </View>
        <NominationPlayers nominee={nominee} nominator={nominator} />
      </View>
      {bigWig ? (
        <View style={styles.bigWigActions}>
          <BigWigPlayerPicker
            bigWig={bigWig}
            onSelect={onSelectBigWig}
            players={players}
            selectedPlayer={selectedBigWigPlayer}
          />
          {activePhase === 'night' && selectedBigWigPlayer ? (
            <KillBigWigButton
              disabled={selectedBigWigPlayerIsDead}
              onPress={() => onKillBigWig(selectedBigWigPlayer, bigWig)}
              playerName={selectedBigWigPlayer.name}
            />
          ) : null}
        </View>
      ) : null}
      <VoterList day={nomination.day} players={players} voterIds={voterIds} />
      <View style={styles.actions}>
        <EditVotesButton
          onPress={() => onEditVotes(voterIds)}
          voteCount={voterIds.length}
          votesNeeded={votesNeeded}
        />
        <View style={styles.rightActions}>
          {activePhase === 'day' && nominee ? (
            nomineeWasExecuted ? (
              <UndoDeathButton
                compact
                label="Unexecute"
                onPress={() => onUndoExecution(nominee)}
                playerName={nominee.name}
              />
            ) : (
              <ExecuteButton
                compact
                disabled={nomineeIsDead}
                disabledLabel="Already Killed"
                onPress={() => onExecute(nominee)}
                playerName={nominee.name}
              />
            )
          ) : null}
          <DeleteNominationButton onDelete={onDelete} />
        </View>
      </View>
    </View>
  );
}

function OnTheBlockBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>On the block</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  bigWigActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  header: { flex: 1, gap: 8 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  rightActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  row: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
});
