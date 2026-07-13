import { View } from 'react-native';

import { Text } from '@/components/text';
import type { Conversation, Player } from '@/types/game';
import {
  buildClosureFromPlayer,
  buildConversationRows,
} from '@/utils/conversation-utils';

type ConversationTableProps = {
  activeDay: number;
  conversations: Conversation[];
  players: Player[];
  selectedPlayerId?: string | null;
};

export function ConversationTable({
  activeDay,
  conversations,
  players,
  selectedPlayerId = null,
}: ConversationTableProps) {
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
          const playerNames = new Map(players.map((player) => [player.id, player.name]));
          return {
            ...row,
            talkedToIds,
            talkedTo: talkedToIds.map((id) => playerNames.get(id) ?? 'Unknown'),
            repeatedPlayerIds: row.repeatedPlayerIds.filter((id) => closure.has(id)),
          };
        })
        .filter(
          (row): row is NonNullable<typeof row> =>
            row !== null && (row.playerId === selectedPlayerId || row.talkedToIds.length > 0),
        )
    : allRows;

  return (
    <View
      style={{
        borderColor: '#334155',
        borderRadius: 8,
        borderWidth: 1,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          backgroundColor: '#1f2937',
          borderBottomColor: '#334155',
          borderBottomWidth: 1,
          flexDirection: 'row',
        }}
      >
        <Text
          selectable
          style={{
            color: '#f8fafc',
            flex: 0.9,
            fontSize: 13,
            fontWeight: '800',
            padding: 12,
          }}
        >
          Player
        </Text>
        <Text
          selectable
          style={{
            color: '#f8fafc',
            flex: 1.4,
            fontSize: 13,
            fontWeight: '800',
            padding: 12,
          }}
        >
          Talked to
        </Text>
      </View>

      {rows.map((row) => (
        <View
          key={row.playerId}
          style={{
            backgroundColor: '#111827',
            borderBottomColor: '#1f2937',
            borderBottomWidth: 1,
            flexDirection: 'row',
            minHeight: 50,
          }}
        >
          <Text
            selectable
            style={{
              color: '#f8fafc',
              flex: 0.9,
              fontSize: 15,
              fontWeight: '700',
              padding: 12,
            }}
          >
            {row.playerName}
          </Text>
          <View style={{ flex: 1.4, flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 10 }}>
            {row.talkedTo.length === 0 ? (
              <Text selectable style={{ color: '#64748b', fontSize: 14 }}>
                None
              </Text>
            ) : (
              row.talkedTo.map((name, index) => {
                const talkedToId = row.talkedToIds[index];
                const repeated = row.repeatedPlayerIds.includes(talkedToId);

                return (
                  <View
                    key={talkedToId}
                    style={{
                      backgroundColor: repeated ? '#78350f' : '#1e293b',
                      borderColor: repeated ? '#f59e0b' : '#334155',
                      borderRadius: 999,
                      borderWidth: 1,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Text
                      selectable
                      style={{
                        color: repeated ? '#fde68a' : '#cbd5e1',
                        fontSize: 13,
                        fontWeight: repeated ? '800' : '600',
                      }}
                    >
                      {name}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
