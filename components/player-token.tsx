import { FlameKindling, Pointer, Skull, Vote } from 'lucide-react-native';
import { useEffect, useState } from 'react';
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
  disabled?: boolean;
  interactionMode?: boolean;
  isInitiator?: boolean;
  isNominated?: boolean;
  isNominator?: boolean;
  isSelected?: boolean;
  player: Player;
  position: PlayerPosition;
  tokenSize: number;
  onMove: (playerId: string, position: PlayerPosition) => void;
  onSelect?: (playerId: string) => void;
};

export function PlayerToken({
  disabled = false,
  interactionMode = false,
  isInitiator = false,
  isNominated = false,
  isNominator = false,
  isSelected = false,
  mapHeight,
  mapWidth,
  onMove,
  onSelect,
  player,
  position,
  tokenSize: tokenSizeProp,
}: PlayerTokenProps) {
  const [isDragReady, setIsDragReady] = useState(false);
  const tokenSize = getTokenSize(tokenSizeProp);
  const DeathIcon = player.death?.kind === 'execution' ? FlameKindling : Skull;
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
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
      runOnJS(setIsDragReady)(true);
    })
    .onUpdate((event) => {
      const nextPosition = clampTokenPosition(
        {
          x: startX.value + event.translationX,
          y: startY.value + event.translationY,
        },
        mapWidth,
        mapHeight,
        tokenSize,
      );

      x.value = nextPosition.x;
      y.value = nextPosition.y;
    })
    .onEnd(() => {
      runOnJS(onMove)(player.id, { x: x.value, y: y.value });
    })
    .onFinalize(() => {
      runOnJS(setIsDragReady)(false);
    });
  const tap = Gesture.Tap().onEnd(() => {
    if (onSelect && !disabled) {
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
            backgroundColor: isDragReady
              ? '#38bdf8'
              : player.death
                ? '#1f2937'
                : isInitiator
                  ? '#fde68a'
                  : isSelected
                    ? '#bbf7d0'
                    : '#f8fafc',
            borderColor: isDragReady
              ? '#e0f2fe'
              : player.death
                ? '#64748b'
                : isInitiator
                  ? '#f59e0b'
                  : isSelected
                    ? '#22c55e'
                    : '#94a3b8',
            borderRadius: tokenSize / 2,
            borderWidth: isSelected ? 3 : 2,
            opacity: disabled ? 0.42 : player.death && !isDragReady ? 0.72 : 1,
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
            color: isDragReady ? '#082f49' : player.death ? '#cbd5e1' : '#0b1120',
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
            <DeathIcon color={deathIconColor} size={13} strokeWidth={2} />
          </View>
        ) : null}
        {isNominator ? (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#312e81',
              borderColor: '#c4b5fd',
              borderRadius: 11,
              borderWidth: 2,
              height: 22,
              justifyContent: 'center',
              left: -2,
              position: 'absolute',
              top: -2,
              width: 22,
            }}
          >
            <Pointer color="#ddd6fe" size={12} strokeWidth={2.3} />
          </View>
        ) : null}
        {isNominated ? (
          <View
            style={{
              alignItems: 'center',
              backgroundColor: '#713f12',
              borderColor: '#fde68a',
              borderRadius: 11,
              borderWidth: 2,
              height: 22,
              justifyContent: 'center',
              position: 'absolute',
              right: -2,
              top: -2,
              width: 22,
            }}
          >
            <Vote color="#fef3c7" size={12} strokeWidth={2.3} />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}
