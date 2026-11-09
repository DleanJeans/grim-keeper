import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { KnavesVerdict } from '@/utils/knaves-utils';

const VERDICT_LABELS: Record<KnavesVerdict, string> = { lie: 'lie?', true: 'true?' };

/** Knaves: which Storyteller gave a Character info line, and whether that one is thought to lie. */
export type KnavesLineStoryteller = {
  /** Position among the game's Storytellers, which picks the colour; unset when not picked yet. */
  index?: number;
  name?: string;
  /** Cycles to the next Storyteller, then none. */
  onPress: () => void;
  verdict?: KnavesVerdict;
};

export type KnavesStorytellerBadgeProps = {
  storyteller: KnavesLineStoryteller;
};

/** Round letter badge of the Storyteller who gave the info, then "lie?" or "true?". */
export function KnavesStorytellerBadge({ storyteller }: KnavesStorytellerBadgeProps) {
  const { index, name, onPress, verdict } = storyteller;
  const isSecond = index !== undefined && index % 2 === 1;

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityHint="Changes which Storyteller gave this info"
        accessibilityLabel={name ? `From Storyteller ${name}` : 'Storyteller not picked'}
        accessibilityRole="button"
        hitSlop={6}
        onPress={onPress}
        style={({ pressed }) => [
          styles.badge,
          index === undefined
            ? styles.badgeNone
            : isSecond
              ? styles.badgeSecond
              : styles.badgeFirst,
          pressed && styles.badgePressed,
        ]}
      >
        <Text
          style={[
            styles.letter,
            index === undefined
              ? styles.letterNone
              : isSecond
                ? styles.letterSecond
                : styles.letterFirst,
          ]}
        >
          {name ? name.trim().charAt(0).toLocaleUpperCase() : '?'}
        </Text>
      </Pressable>
      {verdict ? (
        <Text style={[styles.verdict, verdict === 'lie' ? styles.verdictLie : styles.verdictTrue]}>
          {VERDICT_LABELS[verdict]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  badgeFirst: {
    backgroundColor: colors.knavesFirstSurface,
    borderColor: colors.knavesFirst,
  },
  badgeNone: {
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
  },
  badgePressed: {
    opacity: 0.6,
  },
  badgeSecond: {
    backgroundColor: colors.knavesSecondSurface,
    borderColor: colors.knavesSecond,
  },
  letter: {
    fontSize: 11,
    fontWeight: '900',
  },
  letterFirst: {
    color: colors.knavesFirst,
  },
  letterNone: {
    color: colors.textSubtle,
  },
  letterSecond: {
    color: colors.knavesSecond,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  verdict: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  verdictLie: {
    color: colors.danger,
  },
  verdictTrue: {
    color: colors.roleInfoTokenTrueBorder,
  },
});
