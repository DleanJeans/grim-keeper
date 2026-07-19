import { CircleCheck, FlameKindling, Skull, Vote } from 'lucide-react-native';
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

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, PlayerPosition, Role } from '@/types/game';
import { clampTokenPosition, getTokenSize } from '@/utils/layout-utils';
import { getRoleIconUrl, isTravelerRole } from '@/utils/role-utils';

const BADGE_SIZE = 18;
const ROLE_IMAGE_SCALE = 1.4;
const ROLE_IMAGE_OPACITY = 0.4;
const badgeColors = colors.playerTokenEdgeBadge;
const Colors = {
  backgroundDefault: '#f8fafc',
  backgroundDeath: '#1f2937',
  backgroundDragReady: '#38bdf8',
  backgroundInitiator: '#fde68a',
  backgroundSelected: '#bbf7d0',
  borderDefault: '#94a3b8',
  borderDeath: '#64748b',
  borderDragReady: '#e0f2fe',
  borderInitiator: '#f59e0b',
  borderSelected: '#22c55e',
  textDefault: '#0b1120',
  textDeath: '#cbd5e1',
  textDragReady: '#082f49',
} as const;

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
  const deathIconColor =
    player.death?.kind === 'execution'
      ? badgeColors.deathExecutionIcon
      : badgeColors.deathNightIcon;
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
              ? Colors.backgroundDragReady
              : player.death
                ? Colors.backgroundDeath
                : isSelected
                  ? Colors.backgroundSelected
                  : isInitiator
                    ? Colors.backgroundInitiator
                    : Colors.backgroundDefault,
            borderColor: isDragReady
              ? Colors.borderDragReady
              : isSelected
                ? Colors.borderSelected
                : player.death
                  ? Colors.borderDeath
                  : isInitiator
                    ? Colors.borderInitiator
                    : Colors.borderDefault,
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
            style={[StyleSheet.absoluteFill, { borderRadius: tokenSize / 2, overflow: 'hidden' }]}
            imageStyle={{
              borderRadius: tokenSize / 2,
              opacity: ROLE_IMAGE_OPACITY,
              transform: [{ scale: ROLE_IMAGE_SCALE }],
            }}
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
            color={
              isDragReady
                ? Colors.textDragReady
                : player.death
                  ? Colors.textDeath
                  : Colors.textDefault
            }
            name={player.name}
            roles={visibleRoles}
          />
        </View>
        {player.death ? (
          <PlayerTokenEdgeBadge
            backgroundColor={
              player.death.kind === 'execution'
                ? badgeColors.deathExecutionBackground
                : badgeColors.deathNightBackground
            }
            position={{ bottom: -2, right: -2 }}
          >
            <DeathIcon color={deathIconColor} size={13} strokeWidth={2} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {player.death && player.deadVoteUsed !== true ? (
          <PlayerTokenEdgeBadge
            backgroundColor={badgeColors.deadVoteBackground}
            position={{ bottom: -2, left: -2 }}
          >
            <DeadVoteIcon color={badgeColors.deadVoteIcon} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {isNominator ? (
          <PlayerTokenEdgeBadge
            backgroundColor={badgeColors.nominatorBackground}
            position={{ left: -2, top: -2 }}
          >
            <NomIcon color={badgeColors.nominatorIcon} size={12} strokeWidth={2.3} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {isNominated ? (
          <PlayerTokenEdgeBadge
            backgroundColor={badgeColors.nominatedBackground}
            position={{ right: -2, top: -2 }}
          >
            <Vote color={badgeColors.nominatedIcon} size={12} strokeWidth={2.3} />
          </PlayerTokenEdgeBadge>
        ) : null}
        {rolesConfirmed && visibleRoles.length > 0 && !visibleRoles.some(isTravelerRole) ? (
          <PlayerTokenEdgeBadge
            backgroundColor={badgeColors.confirmedBackground}
            position={{ right: -10, top: tokenSize / 2 - BADGE_SIZE / 2 }}
          >
            <CircleCheck color={badgeColors.confirmedIcon} size={12} strokeWidth={2.8} />
          </PlayerTokenEdgeBadge>
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

function PlayerTokenEdgeBadge({
  backgroundColor,
  children,
  position,
}: {
  backgroundColor: string;
  children: ReactNode;
  position: Pick<ViewStyle, 'bottom' | 'left' | 'right' | 'top'>;
}) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          backgroundColor,
          borderRadius: BADGE_SIZE / 2,
          height: BADGE_SIZE,
          justifyContent: 'center',
          position: 'absolute',
          width: BADGE_SIZE,
        },
        position,
      ]}
    >
      {children}
    </View>
  );
}
