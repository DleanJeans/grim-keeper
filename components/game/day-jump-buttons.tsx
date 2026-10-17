import { useRef } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GamePhase, StartingNight } from '@/types/game';
import {
  type GamePhasePosition,
  getPhaseIndex,
  getPhaseLabel,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';

const BUTTON_GAP = 4;

type DayJumpButtonsProps = {
  activeDay: number;
  activePhase: GamePhase;
  latestPhase: GamePhasePosition;
  startingNight: StartingNight;
  onChangePhase: (day: number, phase: GamePhase) => void;
};

export function DayJumpButtons({
  activeDay,
  activePhase,
  latestPhase,
  startingNight,
  onChangePhase,
}: DayJumpButtonsProps) {
  const activeIndex = getPhaseIndex({ activeDay, activePhase });
  const lastIndex = Math.max(activeIndex, getPhaseIndex(latestPhase));
  const phaseIndexes = Array.from({ length: lastIndex + 1 }, (_, index) => index);
  const buttonRightEdges = useRef<number[]>([]);
  const glideIndex = useRef(activeIndex);

  function glideTo(x: number) {
    const edges = buttonRightEdges.current.slice(0, phaseIndexes.length);
    const found = edges.findIndex((right) => x <= right + BUTTON_GAP / 2);
    const index = found === -1 ? edges.length - 1 : found;
    if (index < 0 || index === glideIndex.current) return;

    glideIndex.current = index;
    const position = getPhasePositionAtIndex(index);
    onChangePhase(position.activeDay, position.activePhase);
  }

  // Horizontal drags glide across phases; vertical drags still scroll the screen.
  const glide = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onStart((event) => {
      glideIndex.current = activeIndex;
      glideTo(event.x);
    })
    .onUpdate((event) => glideTo(event.x));

  return (
    <GestureDetector gesture={glide}>
      <View style={styles.container}>
        {phaseIndexes.map((index) => (
          <PhaseButton
            active={index === activeIndex}
            key={index}
            onChangePhase={onChangePhase}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              buttonRightEdges.current[index] = x + width;
            }}
            position={getPhasePositionAtIndex(index)}
            startingNight={startingNight}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // ponytail: squares shrink into narrower tiles when phases outgrow the screen width
  container: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: BUTTON_GAP,
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 5,
    borderWidth: 1,
    flexShrink: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
  },
  activeLabel: {
    color: colors.onPrimary,
  },
});

type PhaseButtonProps = {
  active: boolean;
  position: GamePhasePosition;
  startingNight: StartingNight;
  onChangePhase: (day: number, phase: GamePhase) => void;
  onLayout: (event: LayoutChangeEvent) => void;
};

function PhaseButton({
  active,
  position,
  startingNight,
  onChangePhase,
  onLayout,
}: PhaseButtonProps) {
  const label = getPhaseLabel(position, startingNight);
  // "Night 2" -> "N2"
  const shortLabel = `${label[0]}${label.split(' ')[1]}`;

  return (
    <Pressable
      accessibilityLabel={`Go to ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      disabled={active}
      onLayout={onLayout}
      onPress={() => onChangePhase(position.activeDay, position.activePhase)}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, active && styles.active]}
    >
      <Text style={[styles.label, active && styles.activeLabel]}>{shortLabel}</Text>
    </Pressable>
  );
}
