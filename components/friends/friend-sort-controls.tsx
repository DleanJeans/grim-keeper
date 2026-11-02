import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { FriendSort } from '@/utils/friend-utils';

const SORT_OPTIONS: Array<{ description: string; label: string; sort: FriendSort }> = [
  { description: 'games played', label: 'Games', sort: 'games' },
  { description: 'win rate', label: 'Win rate', sort: 'winRate' },
  { description: 'good win rate', label: 'Good', sort: 'goodWinRate' },
  { description: 'evil win rate', label: 'Evil', sort: 'evilWinRate' },
];

type FriendSortControlsProps = {
  minGames: number;
  onChangeMinGames: (minGames: number) => void;
  onChangeSort: (sort: FriendSort) => void;
  sort: FriendSort;
};

export function FriendSortControls({
  minGames,
  onChangeMinGames,
  onChangeSort,
  sort,
}: FriendSortControlsProps) {
  const changeMinGames = (value: number) => onChangeMinGames(Math.max(1, value));

  return (
    <View style={styles.container}>
      <View accessibilityLabel="Sort friends" accessibilityRole="toolbar" style={styles.sortRow}>
        {SORT_OPTIONS.map((option) => (
          <SortButton
            description={option.description}
            key={option.sort}
            label={option.label}
            onPress={() => onChangeSort(option.sort)}
            selected={sort === option.sort}
          />
        ))}
      </View>

      {sort === 'games' ? null : (
        <View style={styles.minGamesRow}>
          <Text selectable style={styles.minGamesLabel}>
            {sort === 'winRate'
              ? 'Min games'
              : `Min games as ${sort === 'goodWinRate' ? 'good' : 'evil'}`}
          </Text>
          <Pressable
            accessibilityLabel="Fewer games"
            accessibilityRole="button"
            accessibilityState={{ disabled: minGames <= 1 }}
            disabled={minGames <= 1}
            onPress={() => changeMinGames(minGames - 1)}
            style={({ pressed }) => [
              styles.stepButton,
              pressed && styles.stepButtonPressed,
              minGames <= 1 && styles.stepButtonDisabled,
            ]}
          >
            <Minus color={colors.text} size={17} strokeWidth={2.6} />
          </Pressable>
          <TextInput
            accessibilityLabel="Minimum games"
            inputMode="numeric"
            onChangeText={(text) => changeMinGames(Number.parseInt(text, 10) || 1)}
            selectTextOnFocus
            style={styles.minGamesInput}
            value={String(minGames)}
          />
          <Pressable
            accessibilityLabel="More games"
            accessibilityRole="button"
            onPress={() => changeMinGames(minGames + 1)}
            style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
          >
            <Plus color={colors.text} size={17} strokeWidth={2.6} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  minGamesInput: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    fontWeight: '900',
    height: 36,
    paddingVertical: 0,
    textAlign: 'center',
    textAlignVertical: 'center',
    width: 52,
  },
  minGamesLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  minGamesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 4,
  },
  sortButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  sortButtonSelected: {
    backgroundColor: colors.inputText,
  },
  sortButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  sortButtonTextSelected: {
    color: colors.onPrimary,
  },
  sortRow: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  stepButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  stepButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
});

function SortButton({
  description,
  label,
  onPress,
  selected,
}: {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`Sort by ${description}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.sortButton,
        pressed && styles.sortButtonPressed,
        selected && styles.sortButtonSelected,
      ]}
    >
      <Text style={[styles.sortButtonText, selected && styles.sortButtonTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}
