import { useRef } from 'react';
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const THUMB_SIZE = 20;
const HIT_HEIGHT = 36;
const TRACK_HEIGHT = 6;
const sliderColors = colors.slider;

type DimensionSliderProps = {
  accessibilityLabel: string;
  label: string;
  max: number;
  min: number;
  /** Values the slider snaps to, counted from `min`. */
  step: number;
  value: number;
  /** How the value reads beside the slider, e.g. `90%`. Defaults to the number. */
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
};

/** A labelled slider that shows its value. Tap the track or drag the thumb to set it. */
export function DimensionSlider({
  accessibilityLabel,
  label,
  max,
  min,
  step,
  value,
  formatValue = String,
  onChange,
}: DimensionSliderProps) {
  const trackWidth = useRef(0);
  const fraction = Math.min(1, Math.max(0, (value - min) / (max - min)));

  function setFromX(x: number) {
    if (trackWidth.current <= 0) return;
    const share = Math.min(1, Math.max(0, x / trackWidth.current));
    const snapped = Math.min(max, min + Math.round(((max - min) * share) / step) * step);
    if (snapped !== value) {
      onChange(snapped);
    }
  }

  // Horizontal drags move the thumb; vertical drags still scroll the screen.
  const drag = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onStart((event) => setFromX(event.x))
    .onUpdate((event) => setFromX(event.x));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <GestureDetector gesture={drag}>
        <Pressable
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          accessibilityLabel={accessibilityLabel}
          accessibilityRole="adjustable"
          accessibilityValue={{ max, min, now: value }}
          accessible
          onAccessibilityAction={(event) => {
            const direction = event.nativeEvent.actionName === 'increment' ? 1 : -1;
            onChange(Math.min(max, Math.max(min, value + direction * step)));
          }}
          onLayout={(event: LayoutChangeEvent) => {
            trackWidth.current = event.nativeEvent.layout.width;
          }}
          onPress={(event) => setFromX(getPressX(event))}
          style={styles.hit}
        >
          <View style={styles.track} />
          <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
          <View style={[styles.thumb, { left: `${fraction * 100}%` }]} />
        </Pressable>
      </GestureDetector>
      <Text selectable style={styles.value}>
        {formatValue(value)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    pointerEvents: 'none',
    backgroundColor: sliderColors.fill,
    borderRadius: TRACK_HEIGHT / 2,
    height: TRACK_HEIGHT,
    left: 0,
    position: 'absolute',
  },
  hit: { flex: 1, height: HIT_HEIGHT, justifyContent: 'center' },
  label: { color: colors.gameTextMuted, fontSize: 12, fontWeight: '800', width: 52 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  thumb: {
    pointerEvents: 'none',
    backgroundColor: sliderColors.thumb,
    borderRadius: THUMB_SIZE / 2,
    boxShadow: `0 0 0 3px ${sliderColors.thumbHalo}`,
    height: THUMB_SIZE,
    marginLeft: -THUMB_SIZE / 2,
    position: 'absolute',
    width: THUMB_SIZE,
  },
  track: {
    pointerEvents: 'none',
    backgroundColor: sliderColors.track,
    borderRadius: TRACK_HEIGHT / 2,
    height: TRACK_HEIGHT,
  },
  value: {
    color: colors.gameText,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
    fontWeight: '800',
    textAlign: 'right',
    width: 40,
  },
});

/** Where a tap landed on the track. On web the press event is a mouse event without `locationX`. */
function getPressX(event: GestureResponderEvent) {
  const { locationX, offsetX } = event.nativeEvent as { locationX?: number; offsetX?: number };
  return locationX ?? offsetX ?? 0;
}
