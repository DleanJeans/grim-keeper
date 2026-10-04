import { ChevronLeft, ChevronRight, MoveDiagonal } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { DayStepperButton } from '@/components/game/day-stepper-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';
import type { GamePhase } from '@/types/game';
import { getAdjacentPhasePosition, getPhaseIndex, getPhaseLabel } from '@/utils/game-phase-utils';

type MapModeActionsProps = {
  activeDay: number;
  activePhase: GamePhase;
  startingNight: 0 | 1;
  onChangePhase: (day: number, phase: GamePhase) => void;
};

export function MapModeActions({
  activeDay,
  activePhase,
  startingNight,
  onChangePhase,
}: MapModeActionsProps) {
  const { enterRearrangeMode } = useGameRouteContext();
  const currentPosition = { activeDay, activePhase };
  const prevDisabled = getPhaseIndex(currentPosition) === 0;
  const previousPosition = getAdjacentPhasePosition(currentPosition, -1);
  const nextPosition = getAdjacentPhasePosition(currentPosition, 1);
  const previousLabel = getPhaseLabel(previousPosition, startingNight);
  const nextLabel = getPhaseLabel(nextPosition, startingNight);

  return (
    <View style={styles.container}>
      <DayStepperButton
        accessibilityLabel={
          prevDisabled
            ? `Start at ${getPhaseLabel(currentPosition, startingNight)}`
            : `Go to ${previousLabel}`
        }
        direction="prev"
        disabled={prevDisabled}
        icon={ChevronLeft}
        label={prevDisabled ? getPhaseLabel(currentPosition, startingNight) : previousLabel}
        onPress={() => onChangePhase(previousPosition.activeDay, previousPosition.activePhase)}
      />
      <MapModeButton
        accessibilityLabel="Enter rearrange mode"
        icon={MoveDiagonal}
        label="Rearrange"
        onPress={enterRearrangeMode}
        width={125}
      />
      <DayStepperButton
        accessibilityLabel={`Go to ${nextLabel}`}
        direction="next"
        disabled={false}
        icon={ChevronRight}
        label={nextLabel}
        onPress={() => onChangePhase(nextPosition.activeDay, nextPosition.activePhase)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
});
