import type { ReactNode } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const DEFAULT_MIN_HEIGHT = 480;

export function GameTabContent({ children }: { children: ReactNode }) {
  const minHeight = useSharedValue(DEFAULT_MIN_HEIGHT);
  const animatedStyle = useAnimatedStyle(() => ({ minHeight: minHeight.value }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height <= minHeight.value) return;

    minHeight.value = height;
  };

  return (
    <Animated.View onLayout={handleLayout} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
