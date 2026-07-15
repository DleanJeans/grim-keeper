import { Check, FlameKindling, Skull, Vote } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { NomIcon } from '@/components/game/nom-icon';
import { Text } from '@/components/text';
import type { Player, PlayerPosition, Role } from '@/types/game';
import { clampTokenPosition, getTokenSize } from '@/utils/layout-utils';
import { getRoleIconUrl, isTravelerRole } from '@/utils/role-utils';

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
  roles?: Role[];
  rolesConfirmed?: boolean;
  rearrangeMode?: boolean;
  showRoleDetails?: boolean;
  tokenSize: number;
  onMove: (playerId: string, position: PlayerPosition) => void;
  onSelect?: (playerId: string) => void;
};

export function PlayerToken({
  disabled = false,
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
  rearrangeMode = false,
  roles = [],
  rolesConfirmed = false,
  showRoleDetails = false,
  tokenSize: tokenSizeProp,
}: PlayerTokenProps) {
  const [isDragReady, setIsDragReady] = useState(false);
  const tokenSize = getTokenSize(tokenSizeProp);
  const visibleRoles = showRoleDetails ? roles : roles.filter(isTravelerRole);
  const backgroundRole = visibleRoles.find(isTravelerRole) ?? visibleRoles[0];
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
    <GestureDetector gesture={rearrangeMode ? pan : tap}>
      <Animated.View
        style={[
          {
            alignItems: 'center',
            backgroundColor: isDragReady
              ? '#38bdf8'
              : player.death
                ? '#1f2937'
                : isSelected
                  ? '#bbf7d0'
                  : isInitiator
                    ? '#fde68a'
                    : '#f8fafc',
            borderColor: isDragReady
              ? '#e0f2fe'
              : isSelected
                ? '#22c55e'
                : player.death
                  ? '#64748b'
                  : isInitiator
                    ? '#f59e0b'
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
        {backgroundRole ? (
          <ImageBackground
            source={{ uri: getRoleIconUrl(backgroundRole) }}
            style={[StyleSheet.absoluteFill, { borderRadius: tokenSize / 2 }]}
            imageStyle={{ borderRadius: tokenSize / 2, opacity: 0.48 }}
          />
        ) : null}
        <View
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            zIndex: 1,
          }}
        >
          <PlayerTokenContent
            color={isDragReady ? '#082f49' : player.death ? '#cbd5e1' : '#0b1120'}
            name={player.name}
            roles={visibleRoles}
            rolesConfirmed={rolesConfirmed}
            showRoleDetails={showRoleDetails}
          />
        </View>
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
            <NomIcon color="#ddd6fe" size={12} strokeWidth={2.3} />
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

function PlayerTokenContent({
  color,
  name,
  roles,
  rolesConfirmed,
  showRoleDetails,
}: {
  color: string;
  name: string;
  roles: Role[];
  rolesConfirmed: boolean;
  showRoleDetails: boolean;
}) {
  const roleDetails =
    roles.length > 0 ? (
      <PlayerTokenRoles color={color} roles={roles} rolesConfirmed={rolesConfirmed} />
    ) : null;

  return showRoleDetails ? (
    <>
      {roleDetails}
      <PlayerTokenName color={color} name={name} />
    </>
  ) : (
    <>
      <PlayerTokenName color={color} name={name} />
      {roleDetails}
    </>
  );
}

type PlayerTokenNameProps = {
  color: string;
  name: string;
};

function PlayerTokenName({ color, name }: PlayerTokenNameProps) {
  return (
    <Text
      adjustsFontSizeToFit
      ellipsizeMode="tail"
      minimumFontScale={0.72}
      numberOfLines={1}
      style={{
        color,
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 15,
        textAlign: 'center',
      }}
    >
      {name}
    </Text>
  );
}

function PlayerTokenRoles({
  color,
  roles,
  rolesConfirmed,
}: {
  color: string;
  roles: Role[];
  rolesConfirmed: boolean;
}) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 2, maxWidth: '100%' }}>
      <Text
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        minimumFontScale={0.6}
        numberOfLines={1}
        selectable
        style={{
          color,
          flexShrink: 1,
          fontSize: 8.5,
          fontWeight: '900',
          lineHeight: 11,
          textAlign: 'center',
        }}
      >
        {roles.map((role) => role.name).join(' / ')}
      </Text>
      {rolesConfirmed && !roles.some(isTravelerRole) ? (
        <Check color={color} size={9} strokeWidth={3} />
      ) : null}
    </View>
  );
}
