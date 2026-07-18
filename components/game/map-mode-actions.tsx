import { ChevronLeft, ChevronRight, MoveDiagonal } from 'lucide-react-native';
import { View } from 'react-native';
import { DayStepperButton } from '@/components/game/day-stepper-button';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { MapModeButton } from '@/components/game/map-mode-button';

type MapModeActionsProps = {
  activeDay: number;
  onChangeDay: (day: number) => void;
};

export function MapModeActions({ activeDay, onChangeDay }: MapModeActionsProps) {
  const { enterRearrangeMode } = useGameRouteContext();
  const prevDisabled = activeDay === 1;
  return (
    <View
      style={{
        alignItems: 'center',
        alignSelf: 'stretch',
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
      }}
    >
      <DayStepperButton
        accessibilityLabel="Previous day"
        direction="prev"
        disabled={prevDisabled}
        icon={ChevronLeft}
        label={prevDisabled ? 'Day 1' : `Day ${activeDay - 1}`}
        onPress={() => onChangeDay(activeDay - 1)}
      />
      <MapModeButton
        accessibilityLabel="Enter rearrange mode"
        icon={MoveDiagonal}
        label="Rearrange"
        onPress={enterRearrangeMode}
        width={125}
      />
      <DayStepperButton
        accessibilityLabel="Next day"
        direction="next"
        disabled={false}
        icon={ChevronRight}
        label={`Day ${activeDay + 1}`}
        onPress={() => onChangeDay(activeDay + 1)}
      />
    </View>
  );
}
