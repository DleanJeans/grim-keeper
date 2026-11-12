import { type ReactNode, useState } from 'react';
import {
  type LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';
import {
  type EdgeInsets,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useUiScale } from '@/theme/display-scale';

type UiScaleViewProps = {
  children: ReactNode;
};

/**
 * Fills its parent and draws its children at the UI size picked in Settings: the children lay out
 * in a box `1 / scale` times as big, which is then scaled to fit. At 100% it is two plain views.
 * Wrap the root and the content of every Modal, since a Modal draws outside the root.
 */
export function UiScaleView({ children }: UiScaleViewProps) {
  const scale = useUiScale();
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [measured, setMeasured] = useState<{ height: number; width: number }>();
  const size = measured ?? window;
  const isScaled = scale !== 1;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height, width } = event.nativeEvent.layout;
    setMeasured((current) =>
      current?.height === height && current.width === width ? current : { height, width },
    );
  };

  return (
    <View onLayout={handleLayout} style={styles.fill}>
      <View style={isScaled ? [styles.scaled, getScaledBox(size, scale)] : styles.fill}>
        <SafeAreaInsetsContext.Provider value={isScaled ? scaleInsets(insets, scale) : insets}>
          {children}
        </SafeAreaInsetsContext.Provider>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  scaled: {
    left: 0,
    position: 'absolute',
    top: 0,
    transformOrigin: 'top left',
  },
});

/** The layout box for the children, `1 / scale` times the room, drawn back at `scale`. */
function getScaledBox(size: { height: number; width: number }, scale: number): ViewStyle {
  return { height: size.height / scale, transform: [{ scale }], width: size.width / scale };
}

function scaleInsets(insets: EdgeInsets, scale: number): EdgeInsets {
  return {
    bottom: insets.bottom / scale,
    left: insets.left / scale,
    right: insets.right / scale,
    top: insets.top / scale,
  };
}
