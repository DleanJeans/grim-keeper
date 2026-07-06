import { Skull, Swords } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
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
  const DeathIcon = player.death?.kind === 'execution' ? Skull : Swords;
  const deathIconColor = player.death?.kind === 'execution' ? '#fecaca' : '#bfdbfe';
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
    <GestureDetector gesture={interactionMode ? tap : Gesture.Race(tap, pan)}>
      <Animated.View
        style={[
          {
            alignItems: 'center',
            backgroundColor: player.death
              ? '#1f2937'
              : isInitiator
                ? '#fde68a'
                : isSelected
                  ? '#bbf7d0'
                  : '#f8fafc',
            borderColor: player.death
              ? '#64748b'
              : isInitiator
                ? '#f59e0b'
                : isSelected
                  ? '#22c55e'
                  : '#94a3b8',
            borderRadius: tokenSize / 2,
            borderWidth: isSelected ? 3 : 2,
            opacity: player.death ? 0.72 : 1,
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
          style={{
            color: player.death ? '#cbd5e1' : '#0b1120',
            fontSize: 12,
            fontWeight: '800',
            lineHeight: 15,
            textAlign: 'center',
          }}
        >
          {player.name}
        </Text>
        {player.death ? (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: player.death.kind === 'execution' ? '#7f1d1d' : '#1e3a8a',
              borderColor: '#0b1120',
              borderRadius: 11,
              borderWidth: 2,
              bottom: -2,
              height: 22,
              justifyContent: 'center',
              position: 'absolute',
              right: -2,
              width: 22,
            }}
          >
            <DeathIcon color={deathIconColor} size={13} strokeWidth={3} />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}
