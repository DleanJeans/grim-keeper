import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Text } from '@/components/text';
import type { Player, PlayerPosition } from '@/types/game';
import { clampTokenPosition, getTokenSize } from '@/utils/layout-utils';

type PlayerTokenProps = {
  mapHeight: number;
  mapWidth: number;
  interactionMode?: boolean;
  isInitiator?: boolean;
  isSelected?: boolean;
  player: Player;
  position: PlayerPosition;
  onMove: (playerId: string, position: PlayerPosition) => void;
  onSelect?: (playerId: string) => void;
};

export function PlayerToken({
  interactionMode = false,
  isInitiator = false,
  isSelected = false,
  mapHeight,
  mapWidth,
  onMove,
  onSelect,
  player,
  position,
}: PlayerTokenProps) {
  const tokenSize = getTokenSize();
  const x = useSharedValue(position.x);
  const y = useSharedValue(position.y);
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);

  useEffect(() => {
    x.value = withSpring(position.x);
    y.value = withSpring(position.y);
    startX.value = position.x;
    startY.value = position.y;
  }, [position.x, position.y, startX, startY, x, y]);

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      const nextPosition = clampTokenPosition(
        {
          x: startX.value + event.translationX,
          y: startY.value + event.translationY,
        },
        mapWidth,
        mapHeight,
      );

      x.value = nextPosition.x;
      y.value = nextPosition.y;
    })
    .onEnd(() => {
      runOnJS(onMove)(player.id, { x: x.value, y: y.value });
    });
  const tap = Gesture.Tap().onEnd(() => {
    if (onSelect) {
      runOnJS(onSelect)(player.id);
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    left: x.value - tokenSize / 2,
    top: y.value - tokenSize / 2,
  }));

  return (
    <GestureDetector gesture={interactionMode ? tap : pan}>
      <Animated.View
        style={[
          {
            alignItems: 'center',
            backgroundColor: isInitiator ? '#fde68a' : isSelected ? '#bbf7d0' : '#f8fafc',
            borderColor: isInitiator ? '#f59e0b' : isSelected ? '#22c55e' : '#94a3b8',
            borderRadius: tokenSize / 2,
            borderWidth: isSelected ? 3 : 2,
            height: tokenSize,
            justifyContent: 'center',
            paddingHorizontal: 6,
            position: 'absolute',
            width: tokenSize,
            zIndex: 2,
          },
          animatedStyle,
        ]}
      >
        <Text
          numberOfLines={2}
          selectable
          style={{
            color: '#0b1120',
            fontSize: 12,
            fontWeight: '800',
            lineHeight: 15,
            textAlign: 'center',
          }}
        >
          {player.name}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}
