import { ScrollText } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GamePhase, StartingNight } from '@/types/game';
import { getDayCutoffForPhase, getPhaseLabel } from '@/utils/game-phase-utils';

type DayCountProps = {
  activeDay: number;
  activePhase: GamePhase;
  lastDayWithData: number;
  /** Opens the recap of this night and day. */
  onPress: () => void;
  startingNight: StartingNight;
};

export function DayCount({
  activeDay,
  activePhase,
  lastDayWithData,
  onPress,
  startingNight,
}: DayCountProps) {
  const position = { activeDay, activePhase };
  const dayCutoff = getDayCutoffForPhase(position);

  const phaseLabel = getPhaseLabel(position, startingNight);

  return (
    <Pressable
      accessibilityHint="Shows what happened this night and day"
      accessibilityLabel={`${phaseLabel}. Open recap`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
    >
      <Text style={styles.label}>{phaseLabel}</Text>
      <View style={styles.progressRow}>
        <ScrollText color={colors.gameTextMuted} size={10} strokeWidth={2.6} />
        <Text style={styles.progress}>
          {dayCutoff < 1 ? 'Before Day 1' : `Day ${dayCutoff}/${lastDayWithData}`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 8,
  },
  label: {
    color: colors.gameText,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  pressed: { opacity: 0.65 },
  progressRow: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  progress: {
    color: colors.gameTextMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
