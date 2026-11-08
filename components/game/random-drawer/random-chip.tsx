import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RandomChipProps = {
  /** Text and border colour while on; the dice gold by default. */
  accent?: 'demon' | 'gold' | 'minion' | 'redHerring';
  label: string;
  on: boolean;
  onPress: () => void;
};

/** Toggle chip in the dice drawer, such as "Alive only" or a team filter. */
export function RandomChip({ accent = 'gold', label, on, onPress }: RandomChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        on && styles.chipOn,
        on && accentBorders[accent],
        pressed && styles.chipPressed,
      ]}
    >
      <Text numberOfLines={1} style={[styles.label, on && accentTexts[accent]]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.gameBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: colors.gameSurfaceRaised },
  chipPressed: { backgroundColor: colors.gameSurfacePressed },
  label: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '800' },
});

const accentBorders = StyleSheet.create({
  demon: { borderColor: colors.fakeDemon },
  gold: { borderColor: colors.randomAccent },
  minion: { borderColor: colors.fakeMinion },
  redHerring: { borderColor: colors.fakeRedHerring },
});

const accentTexts = StyleSheet.create({
  demon: { color: colors.fakeDemon },
  gold: { color: colors.randomAccent },
  minion: { color: colors.fakeMinion },
  redHerring: { color: colors.fakeRedHerring },
});
