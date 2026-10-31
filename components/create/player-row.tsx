import { ArrowUpDown, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export type DraftPlayer = {
  id: string;
  name: string;
};

export function PlayerRow({
  index,
  isFixed = false,
  isMoving = false,
  item,
  onPress,
  onRemove,
}: {
  index: number;
  isFixed?: boolean;
  /** This player is picked to move; tapping a gap or another player places them. */
  isMoving?: boolean;
  item: DraftPlayer;
  onPress?: (playerId: string) => void;
  onRemove?: (playerId: string) => void;
}) {
  const canMove = !isFixed && !!onPress;

  return (
    <View style={[styles.row, isMoving && styles.rowActive, isFixed && styles.rowFixed]}>
      <Pressable
        accessibilityHint={
          canMove ? 'Moves this player, or swaps with the picked player.' : undefined
        }
        accessibilityLabel={`${item.name}, player ${index}`}
        accessibilityRole={canMove ? 'button' : undefined}
        accessibilityState={canMove ? { selected: isMoving } : undefined}
        onPress={canMove ? () => onPress(item.id) : undefined}
        style={styles.moveArea}
      >
        <Text selectable style={styles.seat}>
          {index + 1}
        </Text>
        <Text selectable style={[styles.name, isFixed && styles.nameFixed]}>
          {item.name}
        </Text>
        {isFixed ? (
          <Text selectable style={styles.you}>
            You
          </Text>
        ) : canMove ? (
          <ArrowUpDown
            color={isMoving ? colors.primary : colors.textSubtle}
            size={18}
            strokeWidth={2.5}
          />
        ) : null}
      </Pressable>
      {isFixed ? null : (
        <Pressable
          accessibilityLabel={`Remove ${item.name}`}
          accessibilityRole="button"
          hitSlop={7}
          onPress={() => onRemove?.(item.id)}
          style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
        >
          <Trash2 color={colors.danger} size={17} strokeWidth={2.5} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moveArea: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  nameFixed: {
    fontWeight: '800',
  },
  removeButton: {
    alignItems: 'center',
    borderRadius: 8,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  removeButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rowActive: {
    backgroundColor: colors.surfacePressed,
    borderColor: colors.primary,
  },
  rowFixed: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.primary,
  },
  seat: {
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    width: 24,
  },
  you: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
});
