import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GamePhase, StartingNight } from '@/types/game';
import { getDayCutoffForPhase, getPhaseLabel } from '@/utils/game-phase-utils';

type DayCountProps = {
  activeDay: number;
  activePhase: GamePhase;
  lastDayWithData: number;
  startingNight: StartingNight;
};

export function DayCount({
  activeDay,
  activePhase,
  lastDayWithData,
  startingNight,
}: DayCountProps) {
  const position = { activeDay, activePhase };
  const dayCutoff = getDayCutoffForPhase(position);

  return (
    <View style={styles.container}>
      <Text selectable style={styles.label}>
        {getPhaseLabel(position, startingNight)}
      </Text>
      <Text selectable style={styles.progress}>
        {dayCutoff < 1 ? 'Before Day 1' : `Day ${dayCutoff}/${lastDayWithData}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.gameText,
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  progress: {
    color: colors.gameTextMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
});
