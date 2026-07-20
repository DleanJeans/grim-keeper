import { StyleSheet, View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import type { Conversation, ConversationRow, Player } from '@/types/game';
import { buildClosureFromPlayer, buildConversationRows } from '@/utils/conversation-utils';

type ConversationTableProps = {
  activeDay: number;
  conversations: Conversation[];
  players: Player[];
  selectedPlayerId?: string | null;
};

type RowContext = {
  playerById: Map<string, Player>;
};

export function ConversationTable({
  activeDay,
  conversations,
  players,
  selectedPlayerId = null,
}: ConversationTableProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));
  const allRows = buildConversationRows(players, conversations, activeDay);
  const closure = selectedPlayerId
    ? buildClosureFromPlayer(selectedPlayerId, conversations, activeDay)
    : null;
  const rows = closure
    ? allRows
        .map((row) => {
          if (!closure.has(row.playerId)) {
            return null;
          }
          const talkedToIds = row.talkedToIds.filter((id) => closure.has(id));
          return {
            ...row,
            talkedToIds,
            talkedTo: talkedToIds.map((id) => playerById.get(id)?.name ?? 'Unknown'),
            repeatedPlayerIds: row.repeatedPlayerIds.filter((id) => closure.has(id)),
          };
        })
        .filter(
          (row): row is NonNullable<typeof row> =>
            row !== null && (row.playerId === selectedPlayerId || row.talkedToIds.length > 0),
        )
    : allRows;
  const context: RowContext = { playerById };

  return (
    <View style={styles.container}>
      <ConversationTableHeader />
      {rows.map((row) => (
        <ConversationRowView key={row.playerId} row={row} context={context} />
      ))}
    </View>
  );
}

function ConversationTableHeader() {
  return (
    <View style={styles.header}>
      <Text selectable style={styles.headerPlayer}>
        Player
      </Text>
      <Text selectable style={styles.headerTalkedTo}>
        Talked to
      </Text>
    </View>
  );
}

function ConversationRowView({ row, context }: { row: ConversationRow; context: RowContext }) {
  return (
    <View style={styles.row}>
      <PlayerNameCell player={context.playerById.get(row.playerId)} name={row.playerName} />
      <TalkedToCell row={row} context={context} />
    </View>
  );
}

function PlayerNameCell({ player, name }: { player?: Player; name: string }) {
  if (player) {
    return (
      <PlayerNameWithRole
        player={player}
        style={styles.playerCell}
        textStyle={styles.playerCellText}
        roleIconSize={16}
        roleIconScale={2}
      />
    );
  }
  return (
    <Text selectable style={styles.playerCellTextFallback}>
      {name}
    </Text>
  );
}

type TalkedToPillProps = {
  name: string;
  player?: Player;
  repeated: boolean;
};

function TalkedToCell({ row, context }: { row: ConversationRow; context: RowContext }) {
  return (
    <View style={styles.talkedToCell}>
      {row.talkedTo.length === 0 ? (
        <Text selectable style={styles.noneText}>
          None
        </Text>
      ) : (
        row.talkedTo.map((name, index) => {
          const talkedToId = row.talkedToIds[index];
          const repeated = row.repeatedPlayerIds.includes(talkedToId);
          return (
            <TalkedToPill
              key={talkedToId}
              name={name}
              player={context.playerById.get(talkedToId)}
              repeated={repeated}
            />
          );
        })
      )}
    </View>
  );
}

function TalkedToPill({ name, player, repeated }: TalkedToPillProps) {
  const textStyle = repeated ? styles.pillTextRepeated : styles.pillText;
  const containerStyle = repeated ? styles.pillRepeated : styles.pill;

  return (
    <View style={containerStyle}>
      {player ? (
        <PlayerNameWithRole
          player={player}
          roleIconSize={16}
          roleIconScale={2}
          textStyle={textStyle}
        />
      ) : (
        <Text selectable style={textStyle}>
          {name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: '#1f2937',
    borderBottomColor: '#334155',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  headerPlayer: {
    color: '#f8fafc',
    flex: 0.9,
    fontSize: 13,
    fontWeight: '800',
    padding: 12,
  },
  headerTalkedTo: {
    color: '#f8fafc',
    flex: 1.4,
    fontSize: 13,
    fontWeight: '800',
    padding: 12,
  },
  noneText: {
    color: '#64748b',
    fontSize: 14,
  },
  pill: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillRepeated: {
    backgroundColor: '#78350f',
    borderColor: '#f59e0b',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  pillText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextRepeated: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
  },
  playerCell: {
    flex: 0.9,
    padding: 12,
  },
  playerCellText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  playerCellTextFallback: {
    color: '#f8fafc',
    flex: 0.9,
    fontSize: 15,
    fontWeight: '700',
    padding: 12,
  },
  row: {
    backgroundColor: '#111827',
    borderBottomColor: '#1f2937',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 50,
  },
  talkedToCell: {
    flex: 1.4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 10,
  },
});
