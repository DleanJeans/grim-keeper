import { Check, FlameKindling, Skull, Vote } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { ViewStyle } from 'react-native';
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

const playerTokenBadgeSize = 22;

type PlayerTokenProps = {
  mapHeight: number;
  mapWidth: number;
  confirmedRoleIds?: string[];
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
  confirmedRoleIds,
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
  const displayedRoles =
    rolesConfirmed && confirmedRoleIds
      ? roles.filter((role) => confirmedRoleIds.includes(role.id))
      : roles;
  const visibleRoles = showRoleDetails ? displayedRoles : displayedRoles.filter(isTravelerRole);
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
          />
        </View>
        {player.death ? (
          <PlayerTokenEdgeBadge
            backgroundColor={player.death.kind === 'execution' ? '#7f1d1d' : '#1e3a8a'}
            borderColor="#0b1120"
            position={{ bottom: -2, right: -2 }}
          >
            <DeathIcon color={deathIconColor} size={13} strokeWidth={2} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {isNominator ? (
          <PlayerTokenEdgeBadge
            backgroundColor="#312e81"
            borderColor="#c4b5fd"
            position={{ left: -2, top: -2 }}
          >
            <NomIcon color="#ddd6fe" size={12} strokeWidth={2.3} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {isNominated ? (
          <PlayerTokenEdgeBadge
            backgroundColor="#713f12"
            borderColor="#fde68a"
            position={{ right: -2, top: -2 }}
          >
            <Vote color="#fef3c7" size={12} strokeWidth={2.3} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {rolesConfirmed && visibleRoles.length > 0 && !visibleRoles.some(isTravelerRole) ? (
          <PlayerTokenConfirmBadge tokenSize={tokenSize} />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

function PlayerTokenContent({
  color,
  name,
  roles,
}: {
  color: string;
  name: string;
  roles: Role[];
}) {
  const roleDetails = roles.length > 0 ? <PlayerTokenRoles color={color} roles={roles} /> : null;

  return (
    <>
      {roleDetails}
      <PlayerTokenName color={color} name={name} />
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
        lineHeight: 13,
        textAlign: 'center',
      }}
    >
      {name}
    </Text>
  );
}

function PlayerTokenRoles({ color, roles }: { color: string; roles: Role[] }) {
  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', gap: 1, maxWidth: '100%' }}>
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
          lineHeight: 10,
          textAlign: 'center',
        }}
      >
        {roles.map((role) => role.name).join(' / ')}
      </Text>
    </View>
  );
}

function PlayerTokenConfirmBadge({ tokenSize }: { tokenSize: number }) {
  return (
    <PlayerTokenEdgeBadge
      backgroundColor="#166534"
      borderColor="#bbf7d0"
      position={{ right: -2, top: tokenSize / 2 - playerTokenBadgeSize / 2 }}
    >
      <Check color="#dcfce7" size={12} strokeWidth={2.8} />
    </PlayerTokenEdgeBadge>
  );
}

function PlayerTokenEdgeBadge({
  backgroundColor,
  borderColor,
  children,
  position,
}: {
  backgroundColor: string;
  borderColor: string;
  children: ReactNode;
  position: Pick<ViewStyle, 'bottom' | 'left' | 'right' | 'top'>;
}) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor,
          borderColor,
          borderRadius: playerTokenBadgeSize / 2,
          borderWidth: 2,
          height: playerTokenBadgeSize,
          justifyContent: 'center',
          position: 'absolute',
          width: playerTokenBadgeSize,
        },
        position,
      ]}
    >
      {children}
    </View>
  );
}
