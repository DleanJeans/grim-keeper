import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { formatMonthKey } from '@/utils/game-utils';

type FriendMonthFilterProps = {
  /** Months that have games, newest first, as YYYY-MM keys. */
  months: string[];
  /** The selected months. Empty means all time. */
  selectedMonths: string[];
  onChangeMonths: (months: string[]) => void;
};

export function FriendMonthFilter({
  months,
  onChangeMonths,
  selectedMonths,
}: FriendMonthFilterProps) {
  if (months.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        accessibilityLabel="Filter by month"
        contentContainerStyle={styles.chips}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
      >
        <MonthChip
          label="All time"
          onPress={() => onChangeMonths([])}
          selected={selectedMonths.length === 0}
        />
        {months.map((key) => (
          <MonthChip
            key={key}
            label={formatMonthKey(key)}
            onPress={() => onChangeMonths(toggleMonth(selectedMonths, key))}
            selected={selectedMonths.includes(key)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/** Adds the month to the selection, or removes it when it is already selected. */
function toggleMonth(selectedMonths: string[], key: string) {
  return selectedMonths.includes(key)
    ? selectedMonths.filter((month) => month !== key)
    : [...selectedMonths, key];
}

function MonthChip({
  label,
  onPress,
  selected,
}: {
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={label === 'All time' ? 'Show all time' : `Show ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        pressed && styles.chipPressed,
        selected && styles.chipSelected,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
  },
  chipSelected: {
    backgroundColor: colors.inputText,
    borderColor: colors.inputText,
  },
  chips: {
    gap: 8,
    paddingHorizontal: 20,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextSelected: {
    color: colors.onPrimary,
  },
  container: {
    marginHorizontal: -20,
  },
});
