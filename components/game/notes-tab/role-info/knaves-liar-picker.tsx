import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, StartingNight } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import type { KnavesGuess } from '@/utils/knaves-utils';

export type KnavesLiarPickerProps = {
  guess: KnavesGuess;
  /** Offer a switch at the dusk of each day through this one. */
  lastDay: number;
  onChange: (guess: KnavesGuess) => void;
  startingNight: StartingNight;
  storytellers: Player[];
};

/**
 * Knaves: chips for which Storyteller the app user thinks lies, and once one is picked, the day
 * they switched at dusk.
 */
export function KnavesLiarPicker({
  guess,
  lastDay,
  onChange,
  startingNight,
  storytellers,
}: KnavesLiarPickerProps) {
  const liarId = storytellers.some((storyteller) => storyteller.id === guess.knavesLiarId)
    ? guess.knavesLiarId
    : undefined;
  const switchDays = Array.from({ length: Math.max(0, lastDay) }, (_, index) => index + 1);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.label}>Who lies?</Text>
        {storytellers.map((storyteller, index) => (
          <Chip
            colorIndex={index}
            key={storyteller.id}
            label={storyteller.name}
            onPress={() =>
              onChange({
                ...guess,
                knavesLiarId: liarId === storyteller.id ? undefined : storyteller.id,
              })
            }
            selected={liarId === storyteller.id}
          />
        ))}
        <Chip
          label="Not sure"
          onPress={() => onChange({ ...guess, knavesLiarId: undefined })}
          selected={!liarId}
        />
      </View>
      {liarId && switchDays.length > 0 ? (
        <View style={styles.row}>
          <Text style={styles.label}>Switched at dusk</Text>
          <Chip
            label="Never"
            onPress={() => onChange({ ...guess, knavesSwitchDay: undefined })}
            selected={guess.knavesSwitchDay === undefined}
          />
          {switchDays.map((day) => (
            <Chip
              key={day}
              label={getPhaseLabel({ activeDay: day, activePhase: 'day' }, startingNight)}
              onPress={() =>
                onChange({
                  ...guess,
                  knavesSwitchDay: guess.knavesSwitchDay === day ? undefined : day,
                })
              }
              selected={guess.knavesSwitchDay === day}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipFirst: {
    borderColor: colors.knavesFirst,
  },
  chipFirstSelected: {
    backgroundColor: colors.knavesFirstSurface,
  },
  chipPressed: {
    backgroundColor: colors.surfacePressed,
  },
  chipSecond: {
    borderColor: colors.knavesSecond,
  },
  chipSecondSelected: {
    backgroundColor: colors.knavesSecondSurface,
  },
  chipSelected: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.text,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  chipTextFirst: {
    color: colors.knavesFirst,
  },
  chipTextSecond: {
    color: colors.knavesSecond,
  },
  chipTextSelected: {
    color: colors.text,
  },
  container: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingBottom: 8,
  },
  label: {
    color: colors.noteDayHeader,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  liarMark: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});

/** One chip; a Storyteller's chip takes their colour, and the liar's says "Lies". */
function Chip({
  colorIndex,
  label,
  onPress,
  selected,
}: {
  colorIndex?: number;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const isSecond = colorIndex !== undefined && colorIndex % 2 === 1;
  const isStoryteller = colorIndex !== undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isStoryteller && (isSecond ? styles.chipSecond : styles.chipFirst),
        selected &&
          (isStoryteller
            ? isSecond
              ? styles.chipSecondSelected
              : styles.chipFirstSelected
            : styles.chipSelected),
        pressed && styles.chipPressed,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          isStoryteller && (isSecond ? styles.chipTextSecond : styles.chipTextFirst),
          selected && !isStoryteller && styles.chipTextSelected,
        ]}
      >
        {isStoryteller && selected ? <Text style={styles.liarMark}>Lies · </Text> : null}
        {label}
      </Text>
    </Pressable>
  );
}
