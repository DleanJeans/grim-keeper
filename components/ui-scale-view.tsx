import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useUiScale } from '@/theme/ui-scale';

type UiScaleViewProps = {
  children: ReactNode;
};

/**
 * Draws its children at the UI size picked in Settings. They lay out in a box that is larger or
 * smaller by that size and the box is scaled to fill this view, so layout, icons and text all
 * grow or shrink together. Used at the root of the app and inside each Modal, which draws in
 * its own window.
 *
 * While scaled it also makes room for the keyboard itself, because KeyboardAvoidingView measures
 * in the scaled units and gets the keyboard's height wrong; see `KeyboardAvoidingView` in
 * components/keyboard-avoiding-view.tsx.
 */
export function UiScaleView({ children }: UiScaleViewProps) {
  const scale = useUiScale();
  const scaled = scale !== 1;
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  const outer = useRef<View>(null);
  const [size, setSize] = useState({ height: window.height, width: window.width });
  const keyboardOverlap = useKeyboardOverlap(outer, scaled);

  const scaledInsets = useMemo(
    () => ({
      bottom: insets.bottom / scale,
      left: insets.left / scale,
      right: insets.right / scale,
      top: insets.top / scale,
    }),
    [insets, scale],
  );
  const scaledFrame = useMemo(
    () => ({
      height: frame.height / scale,
      width: frame.width / scale,
      x: frame.x / scale,
      y: frame.y / scale,
    }),
    [frame, scale],
  );

  function handleLayout(event: LayoutChangeEvent) {
    const { height, width } = event.nativeEvent.layout;
    setSize((current) =>
      current.height === height && current.width === width ? current : { height, width },
    );
  }

  return (
    <View onLayout={handleLayout} ref={outer} style={styles.outer}>
      <View
        style={
          scaled
            ? [
                styles.scaled,
                {
                  height: Math.max(0, size.height - keyboardOverlap) / scale,
                  transform: [{ scale }],
                  width: size.width / scale,
                },
              ]
            : styles.unscaled
        }
      >
        <SafeAreaInsetsContext.Provider value={scaled ? scaledInsets : insets}>
          <SafeAreaFrameContext.Provider value={scaled ? scaledFrame : frame}>
            {children}
          </SafeAreaFrameContext.Provider>
        </SafeAreaInsetsContext.Provider>
      </View>
    </View>
  );
}

/** How far the open keyboard covers the bottom of `view`, while `enabled`. */
function useKeyboardOverlap(view: React.RefObject<View | null>, enabled: boolean) {
  const [overlap, setOverlap] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setOverlap(0);
      return;
    }
    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      const keyboardTop = event.endCoordinates.screenY;
      view.current?.measureInWindow((_x, y, _width, height) => {
        setOverlap(Math.max(0, y + height - keyboardTop));
      });
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setOverlap(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [enabled, view]);

  return overlap;
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    overflow: 'hidden',
  },
  scaled: {
    left: 0,
    position: 'absolute',
    top: 0,
    transformOrigin: 'left top',
  },
  unscaled: {
    flex: 1,
  },
});
