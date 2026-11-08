import { ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type CharacterInfoCollapsedProps = {
  onPress: () => void;
  rowCount: number;
};

/** Character info folded into one row while roles are hidden; tapping shows roles and opens it. */
export function CharacterInfoCollapsed({ onPress, rowCount }: CharacterInfoCollapsedProps) {
  return (
    <Pressable
      accessibilityHint="Shows roles and opens Character info"
      accessibilityLabel="Character info"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Text style={styles.title}>Character info</Text>
      {rowCount > 0 ? (
        <Text style={styles.count}>
          {rowCount} {rowCount === 1 ? 'character' : 'characters'}
        </Text>
      ) : null}
      <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.textMuted, flex: 1, fontSize: 12, fontWeight: '700' },
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  rowPressed: { backgroundColor: colors.surfacePressed },
  title: { color: colors.text, fontSize: 15, fontWeight: '900' },
});
