import { GripVertical, Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export type DraftPlayer = {
  id: string;
  name: string;
};

export function PlayerRow({
  drag,
  index,
  isActive = false,
  isEditing,
  isFixed = false,
  item,
  onRemove,
}: {
  drag?: () => void;
  index: number;
  isActive?: boolean;
  isEditing: boolean;
  isFixed?: boolean;
  item: DraftPlayer;
  onRemove?: (playerId: string) => void;
}) {
  return (
    <View style={[styles.row, isActive && styles.rowActive, isFixed && styles.rowFixed]}>
      <Pressable
        accessibilityHint={
          isEditing || isFixed ? undefined : 'Long press to rearrange this player.'
        }
        accessibilityLabel={`${item.name}, player ${index}`}
        accessibilityRole={isEditing || isFixed ? undefined : 'button'}
        onLongPress={isEditing || isFixed ? undefined : drag}
        style={styles.dragArea}
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
        ) : isEditing ? null : (
          <GripVertical color={colors.textSubtle} size={18} strokeWidth={2.5} />
        )}
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
  dragArea: {
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
