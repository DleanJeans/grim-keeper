import { MessagesSquare, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Conversation, Player } from '@/types/game';

type InteractionCardProps = {
  conversation: Conversation;
  /** One-based position of this interaction among the day's interactions. */
  number: number;
  onDelete: (conversationId: string) => void;
  playerById: ReadonlyMap<string, Player>;
  /** Set when the same group already talked on other days. */
  repeat?: { dayCount: number; dayLabels: string[] };
};

export function InteractionCard({
  conversation,
  number,
  onDelete,
  playerById,
  repeat,
}: InteractionCardProps) {
  const showDialog = useAppDialog();
  const initiator = playerById.get(conversation.initiatorId);
  const talkedToPlayers = conversation.participantIds
    .filter((playerId) => playerId !== conversation.initiatorId)
    .map((playerId) => ({ playerId, player: playerById.get(playerId) }));

  return (
    <View style={[styles.card, repeat ? styles.cardRepeated : null]}>
      <View style={styles.row}>
        <Text selectable style={styles.number}>
          {number}.
        </Text>
        <View style={styles.players}>
          {initiator ? (
            <PlayerNameWithRole player={initiator} textStyle={styles.initiatorName} />
          ) : (
            <Text selectable style={styles.initiatorName}>
              Unknown
            </Text>
          )}
          <View style={styles.talkedTo}>
            <MessagesSquare color={colors.textMuted} size={14} />
            <View style={styles.talkedToNames}>
              {talkedToPlayers.length === 0 ? (
                <Text selectable style={styles.talkedToName}>
                  Unknown
                </Text>
              ) : (
                talkedToPlayers.map(({ playerId, player }) =>
                  player ? (
                    <PlayerNameWithRole
                      key={player.id}
                      bordered
                      player={player}
                      iconSize={20}
                      textStyle={styles.talkedToName}
                    />
                  ) : (
                    <Text key={playerId} selectable style={styles.talkedToName}>
                      Unknown
                    </Text>
                  ),
                )
              )}
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            showDialog('Delete interaction?', 'This removes the recorded conversation.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => onDelete(conversation.id),
              },
            ])
          }
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        >
          <Trash2 color={colors.danger} size={15} strokeWidth={2.6} />
        </Pressable>
      </View>
      {repeat ? (
        <View style={styles.repeatBadges}>
          {repeat.dayLabels.map((label) => (
            <RepeatBadge key={label} label={label} />
          ))}
          <RepeatBadge label={`x${repeat.dayCount}`} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10,
    paddingLeft: 20,
  },
  cardRepeated: {
    backgroundColor: colors.repeatSurface,
    borderColor: colors.repeatBorder,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  deleteButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  initiatorName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 21,
  },
  number: {
    color: colors.textMuted,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    width: 28,
  },
  players: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  repeatBadge: {
    backgroundColor: colors.repeatBadgeBackground,
    borderColor: colors.repeatBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  repeatBadgeText: {
    color: colors.repeatBadgeText,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  repeatBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  talkedTo: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  talkedToName: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  talkedToNames: {
    flexDirection: 'row',
    flexShrink: 1,
    flexWrap: 'wrap',
    gap: 4,
  },
});

function RepeatBadge({ label }: { label: string }) {
  return (
    <View style={styles.repeatBadge}>
      <Text selectable style={styles.repeatBadgeText}>
        {label}
      </Text>
    </View>
  );
}
