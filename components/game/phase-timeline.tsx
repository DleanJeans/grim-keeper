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

/** Most stops shown at once; longer games fold their oldest phases into a "…" stop. */
const MAX_STOPS = 13;
const DOT_SIZE = 14;
const CURRENT_DOT_SIZE = 20;
const cardColors = colors.dayCard;

type PhaseTimelineProps = {
  activeDay: number;
  activePhase: GamePhase;
  latestPhase: GamePhasePosition;
  startingNight: StartingNight;
  onChangePhase: (day: number, phase: GamePhase) => void;
};

type Stop = {
  /** The phase this stop goes to. */
  index: number;
  kind: 'earlier' | 'phase' | 'upcoming';
};

/**
 * Every phase so far as a dot on a line, plus an empty dot for the next phase. Tap a dot to go
 * there, or drag along the line to glide across phases.
 */
export function PhaseTimeline({
  activeDay,
  activePhase,
  latestPhase,
  startingNight,
  onChangePhase,
}: PhaseTimelineProps) {
  const activeIndex = getPhaseIndex({ activeDay, activePhase });
  const lastIndex = Math.max(activeIndex, getPhaseIndex(latestPhase));
  const stops = getStops(activeIndex, lastIndex);
  const width = useRef(0);
  const glideIndex = useRef(activeIndex);

  function glideTo(x: number) {
    if (width.current <= 0) return;
    const slot = Math.min(
      stops.length - 1,
      Math.max(0, Math.floor((x / width.current) * stops.length)),
    );
    const index = stops[slot].index;
    if (index === glideIndex.current) return;

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
      <View
        onLayout={(event: LayoutChangeEvent) => {
          width.current = event.nativeEvent.layout.width;
        }}
        style={styles.container}
      >
        {stops.map((stop, slot) => (
          <PhaseStop
            active={stop.index === activeIndex}
            first={slot === 0}
            last={slot === stops.length - 1}
            key={`${stop.kind}-${stop.index}`}
            lastIndex={lastIndex}
            onChangePhase={onChangePhase}
            startingNight={startingNight}
            stop={stop}
          />
        ))}
      </View>
    </GestureDetector>
  );
}

/** The stops to draw: every phase up to the latest one and the next one, folded when long. */
function getStops(activeIndex: number, lastIndex: number): Stop[] {
  const upcomingIndex = lastIndex + 1;
  const total = upcomingIndex + 1;
  if (total <= MAX_STOPS) {
    return Array.from({ length: total }, (_, index) => ({
      index,
      kind: index === upcomingIndex ? 'upcoming' : 'phase',
    }));
  }

  // One slot goes to the "…" stop; keep the newest phases, but always the active one.
  const shown = MAX_STOPS - 1;
  let start = total - shown;
  if (activeIndex < start + 1) {
    start = Math.max(1, activeIndex - 1);
  }
  const end = Math.min(upcomingIndex, start + shown - 1);
  const stops: Stop[] = [{ index: start - 1, kind: 'earlier' }];
  for (let index = start; index <= end; index += 1) {
    stops.push({ index, kind: index === upcomingIndex ? 'upcoming' : 'phase' });
  }
  return stops;
}

type PhaseStopProps = {
  active: boolean;
  first: boolean;
  last: boolean;
  lastIndex: number;
  startingNight: StartingNight;
  stop: Stop;
  onChangePhase: (day: number, phase: GamePhase) => void;
};

function PhaseStop({
  active,
  first,
  last,
  lastIndex,
  startingNight,
  stop,
  onChangePhase,
}: PhaseStopProps) {
  const position = getPhasePositionAtIndex(stop.index);
  const label = getPhaseLabel(position, startingNight);
  // "Night 2" -> "N2"
  const shortLabel = stop.kind === 'earlier' ? '…' : `${label[0]}${label.split(' ')[1]}`;
  const reached = stop.index <= lastIndex;
  const night = position.activePhase === 'night';

  return (
    <Pressable
      accessibilityLabel={stop.kind === 'earlier' ? `Go to ${label} and earlier` : `Go to ${label}`}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      disabled={active}
      hitSlop={{ bottom: 6, top: 6 }}
      onPress={() => onChangePhase(position.activeDay, position.activePhase)}
      style={({ pressed }) => [styles.stop, pressed && styles.pressed]}
    >
      <View style={styles.dotRow}>
        {/* Each stop draws its half of the line on both sides, so lines never cover a dot. */}
        {first ? null : (
          <View
            style={[styles.line, styles.leftLine, reached ? styles.pastLine : styles.upcomingLine]}
          />
        )}
        {last ? null : (
          <View
            style={[
              styles.line,
              styles.rightLine,
              stop.index + 1 <= lastIndex ? styles.pastLine : styles.upcomingLine,
            ]}
          />
        )}
        <View
          style={[
            styles.dot,
            night ? styles.nightDot : styles.dayDot,
            reached && styles.pastDot,
            stop.kind === 'upcoming' && styles.upcomingDot,
            stop.kind === 'earlier' && styles.earlierDot,
            active && styles.currentDot,
          ]}
        />
      </View>
      <Text numberOfLines={1} style={[styles.label, active && styles.currentLabel]}>
        {shortLabel}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { alignSelf: 'stretch', flexDirection: 'row' },
  currentDot: {
    backgroundColor: cardColors.currentDot,
    borderColor: cardColors.currentDot,
    borderRadius: CURRENT_DOT_SIZE / 2,
    boxShadow: `0 0 0 4px ${cardColors.currentHalo}`,
    height: CURRENT_DOT_SIZE,
    width: CURRENT_DOT_SIZE,
  },
  currentLabel: { color: cardColors.title },
  dayDot: { backgroundColor: cardColors.dayDot },
  dot: {
    borderColor: cardColors.dotBorder,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    height: DOT_SIZE,
    width: DOT_SIZE,
  },
  dotRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    height: CURRENT_DOT_SIZE,
    justifyContent: 'center',
  },
  earlierDot: { backgroundColor: 'transparent', borderStyle: 'dotted' },
  label: { color: colors.gameTextMuted, fontSize: 9.5, fontWeight: '800' },
  line: {
    height: 2,
    position: 'absolute',
    top: CURRENT_DOT_SIZE / 2 - 1,
    width: '50%',
  },
  leftLine: { left: 0 },
  rightLine: { right: 0 },
  nightDot: { backgroundColor: cardColors.nightDot },
  pastDot: { borderColor: cardColors.pastDotBorder },
  pastLine: { backgroundColor: cardColors.pastLine },
  pressed: { opacity: 0.6 },
  stop: { alignItems: 'center', flex: 1, gap: 3, minWidth: 0 },
  upcomingDot: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  upcomingLine: { backgroundColor: cardColors.line },
});
