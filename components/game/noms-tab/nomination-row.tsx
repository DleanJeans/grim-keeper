import { StyleSheet, View } from 'react-native';

import { ExecuteButton } from '@/components/game/deaths-tab/death-actions/execute-button';
import { UndoDeathButton } from '@/components/game/deaths-tab/death-actions/undo-death-button';
import { BigWigPlayerPicker } from '@/components/game/noms-tab/big-wig-player-picker';
import { DeleteNominationButton } from '@/components/game/noms-tab/delete-nomination-button';
import { EditVotesButton } from '@/components/game/noms-tab/edit-votes-button';
import { NominationPlayers } from '@/components/game/noms-tab/nomination-players';
import { VoterList } from '@/components/game/noms-tab/voter-list';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player, Role } from '@/types/game';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

type NominationRowProps = {
  activeDay: number;
  bigWig?: Role;
  index: number;
  nomination: Conversation;
  onDelete: () => void;
  onEditVotes: (voterIds: string[]) => void;
  onExecute: (player: Player) => void;
  onSelectBigWig: (playerId?: string) => void;
  onUndoExecution: (player: Player) => void;
  players: Player[];
};

export function NominationRow({
  activeDay,
  bigWig,
  index,
  nomination,
  onDelete,
  onEditVotes,
  onExecute,
  onSelectBigWig,
  onUndoExecution,
  players,
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
  const nomineeIsDead = nominee ? isPlayerCurrentlyDead(nominee, activeDay) : false;
  const nomineeWasExecuted = nomineeIsDead && nominee?.death?.kind === 'execution';

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <Text selectable style={styles.label}>
          Nomination {index + 1}
        </Text>
        <NominationPlayers nominee={nominee} nominator={nominator} />
      </View>
      {bigWig ? (
        <BigWigPlayerPicker
          bigWig={bigWig}
          onSelect={onSelectBigWig}
          players={players}
          selectedPlayer={selectedBigWigPlayer}
        />
      ) : null}
      <VoterList day={nomination.day} players={players} voterIds={voterIds} />
      <View style={styles.actions}>
        <EditVotesButton onPress={() => onEditVotes(voterIds)} voteCount={voterIds.length} />
        <View style={styles.rightActions}>
          {nominee ? (
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

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  header: { flex: 1, gap: 8 },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
  },
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
