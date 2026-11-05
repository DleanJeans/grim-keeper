import { type ReactNode, useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { colors } from '@/theme/colors';

/** How far a horizontal swipe has to travel before it changes the phase. */
const SWIPE_DISTANCE = 60;
/** How long clicks stay off after a swipe, so the browser's click doesn't press a button. */
const PRESS_PAUSE_MS = 300;

type DayCardProps = {
  children: ReactNode;
  /** -1 goes to the previous phase (swipe right), 1 to the next one (swipe left). */
  onSwipe: (direction: -1 | 1) => void;
};

/** The card under the map that holds the day title, the phase timeline and the counts. */
export function DayCard({ children, onSwipe }: DayCardProps) {
  const contentRef = useRef<View>(null);
  const swiping = useRef(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On the web a swipe that starts on a button still ends in a click on it; swallow that click.
  useEffect(() => {
    const node = contentRef.current as unknown as HTMLElement | null;
    if (Platform.OS !== 'web' || !node?.addEventListener) return;
    const blockClick = (event: MouseEvent) => {
      if (swiping.current) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    node.addEventListener('click', blockClick, true);
    return () => {
      node.removeEventListener('click', blockClick, true);
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
    };
  }, []);

  // Horizontal swipes page between phases; vertical drags still scroll the screen.
  const swipe = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .onStart(() => {
      if (resumeTimer.current) clearTimeout(resumeTimer.current);
      swiping.current = true;
    })
    .onFinalize(() => {
      resumeTimer.current = setTimeout(() => {
        swiping.current = false;
      }, PRESS_PAUSE_MS);
    })
    .onEnd((event) => {
      if (event.translationX <= -SWIPE_DISTANCE) {
        onSwipe(1);
      } else if (event.translationX >= SWIPE_DISTANCE) {
        onSwipe(-1);
      }
    });

  return (
    <GestureDetector gesture={swipe}>
      <View style={styles.card}>
        <View ref={contentRef} style={styles.content}>
          {children}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dayCard.background,
    borderColor: colors.dayCard.border,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  content: { gap: 10 },
});
