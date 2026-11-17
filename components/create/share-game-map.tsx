import { useEffect, useRef, useState } from 'react';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GrimoireTokenFace } from '@/components/game/grimoire-token-face';
import { colors } from '@/theme/colors';
import { getQuarterTurnsToBottom, type SharedGame } from '@/utils/share-game-link';

const MAX_MAP_SIZE = 380;
const MIN_TOKEN_SIZE = 40;
const DEFAULT_TOKEN_SIZE = 100;
const TURN_DURATION_MS = 650;
const SELECTED_SCALE = 1.12;
const DIMMED_OPACITY = 0.55;

type ShareGameMapProps = {
  /** Players who can be picked on the map; the sharer and the Storytellers cannot. */
  pickableIndexes: number[];
  onSelect: (index: number) => void;
  selectedIndex?: number;
  sharedGame: SharedGame;
};

/**
 * The shared game's map before joining. Tapping a token picks that player; the map then turns
 * in quarter turns until their token is at the bottom, the way the game opens afterwards.
 */
export function ShareGameMap({
  onSelect,
  pickableIndexes,
  selectedIndex,
  sharedGame,
}: ShareGameMapProps) {
  const [width, setWidth] = useState(0);
  const angle = useSharedValue(0);
  const targetAngleRef = useRef(0);
  const size = Math.min(width, MAX_MAP_SIZE);
  const tokenSize = Math.max(
    MIN_TOKEN_SIZE,
    ((sharedGame.t ?? DEFAULT_TOKEN_SIZE) * size) / Math.max(sharedGame.w, sharedGame.h),
  );

  useEffect(() => {
    if (selectedIndex === undefined) {
      return;
    }

    const player = sharedGame.p[selectedIndex];
    if (!player) {
      return;
    }

    const turns = getQuarterTurnsToBottom(
      { x: player[2], y: player[3] },
      sharedGame.w,
      sharedGame.h,
    );
    // Take the shorter way round from wherever the map is now.
    const current = targetAngleRef.current;
    const difference = ((((turns * 90 - current) % 360) + 540) % 360) - 180;
    targetAngleRef.current = current + difference;
    angle.value = withTiming(targetAngleRef.current, {
      duration: TURN_DURATION_MS,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [angle, selectedIndex, sharedGame]);

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View onLayout={handleLayout} style={styles.wrapper}>
      {size > 0 ? (
        <View style={[styles.map, { height: size, width: size }]}>
          {sharedGame.p.map((player, index) => (
            <ShareMapToken
              angle={angle}
              dimmed={selectedIndex !== undefined && index !== selectedIndex}
              index={index}
              key={`${player[0]}-${player[1]}`}
              mapSize={size}
              name={player[0]}
              onSelect={onSelect}
              pickable={pickableIndexes.includes(index)}
              selected={index === selectedIndex}
              storyteller={!!player[4]}
              tokenSize={tokenSize}
              u={player[2] / sharedGame.w}
              v={player[3] / sharedGame.h}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type ShareMapTokenProps = {
  angle: SharedValue<number>;
  dimmed: boolean;
  index: number;
  mapSize: number;
  name: string;
  onSelect: (index: number) => void;
  pickable: boolean;
  selected: boolean;
  storyteller: boolean;
  tokenSize: number;
  u: number;
  v: number;
};

function ShareMapToken({
  angle,
  dimmed,
  index,
  mapSize,
  name,
  onSelect,
  pickable,
  selected,
  storyteller,
  tokenSize,
  u,
  v,
}: ShareMapTokenProps) {
  const half = tokenSize / 2;
  const limit = mapSize - tokenSize;
  // Each token travels round the map's center, so names stay upright while the map turns.
  const positionStyle = useAnimatedStyle(() => {
    const radians = (angle.value * Math.PI) / 180;
    const dx = (u - 0.5) * mapSize;
    const dy = (v - 0.5) * mapSize;
    const x = mapSize / 2 + dx * Math.cos(radians) - dy * Math.sin(radians) - half;
    const y = mapSize / 2 + dx * Math.sin(radians) + dy * Math.cos(radians) - half;

    return {
      left: Math.min(limit, Math.max(0, x)),
      top: Math.min(limit, Math.max(0, y)),
      transform: [{ scale: selected ? SELECTED_SCALE : 1 }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.token,
        { height: tokenSize, width: tokenSize },
        dimmed && styles.tokenDimmed,
        selected && styles.tokenSelected,
        positionStyle,
      ]}
    >
      <Pressable
        accessibilityLabel={pickable ? `I am ${name}` : name}
        accessibilityRole="button"
        accessibilityState={{ disabled: !pickable, selected }}
        disabled={!pickable}
        onPress={() => onSelect(index)}
        style={styles.tokenPress}
      >
        <GrimoireTokenFace
          compactInitial={false}
          dead={false}
          id={`share-${index}`}
          layer="base"
          name={name}
          ring={selected ? 'selected' : undefined}
          showInitial
          size={tokenSize}
          storyteller={storyteller}
        />
        <GrimoireTokenFace
          compactInitial={false}
          dead={false}
          id={`share-${index}`}
          layer="drape"
          name={name}
          ring={selected ? 'selected' : undefined}
          showInitial
          size={tokenSize}
          storyteller={storyteller}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  map: {
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  token: {
    position: 'absolute',
  },
  tokenDimmed: {
    opacity: DIMMED_OPACITY,
  },
  tokenPress: {
    height: '100%',
    width: '100%',
  },
  tokenSelected: {
    zIndex: 2,
  },
  wrapper: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
});
