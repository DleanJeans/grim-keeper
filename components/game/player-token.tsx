import { useEffect, useState } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { Text } from '@/components/text';
import { useRoleIconSource } from '@/hooks/use-role-icon-source';
import { colors } from '@/theme/colors';
import type { Player, PlayerPosition, Role } from '@/types/game';
import { clampTokenPosition, getTokenSize } from '@/utils/layout-utils';
import { isTravelerRole } from '@/utils/role-utils';
import type { SuspicionLevel } from '@/utils/suspicion-utils';

const MAX_BADGE_SIZE = 18;
const BADGE_SIZE_RATIO = 0.22;
const DEFAULT_BORDER_WIDTH = 2;
const SELECTED_BORDER_WIDTH = 3;
const ROLE_IMAGE_SCALE = 1.4;
const SUSPICION_DOT_RATIO = 0.75;
const ROLE_IMAGE_OPACITY = 0.4;
const EMPTY_OTHER_TOKEN_POSITIONS: OtherTokenPosition[] = [];
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

/** Center of another token on the map; `size` defaults to this token's size. */
export type OtherTokenPosition = { size?: number; x: number; y: number };

type PlayerTokenProps = {
  mapHeight: number;
  mapScale: number;
  mapWidth: number;
  confirmedRoleIds?: string[];
  deadVoteAvailable?: boolean;
  disabled?: boolean;
  /** Faded but still tappable, e.g. cleared players under the suspect filter. */
  dimmed?: boolean;
  /** Label shown on the token; defaults to the player's name. */
  displayName?: string;
  interactionMode?: boolean;
  isInitiator?: boolean;
  isSelected?: boolean;
  otherTokenPositions?: OtherTokenPosition[];
  player: Player;
  position: PlayerPosition;
  roles?: Role[];
  rolesConfirmed?: boolean;
  rearrangeMode?: boolean;
  showRoleDetails?: boolean;
  /** Small dot at the top right: the app user's trust in this player. */
  suspicion?: SuspicionLevel;
  tokenSize: number;
  /** Multiplier on `tokenSize`, e.g. 0.75 for Storytellers when there are several. */
  tokenScale?: number;
  onMove: (playerId: string, position: PlayerPosition) => void;
  onSelect?: (playerId: string) => void;
};

export function PlayerToken({
  confirmedRoleIds,
  deadVoteAvailable,
  dimmed = false,
  disabled = false,
  displayName,
  isInitiator = false,
  isSelected = false,
  mapHeight,
  mapScale,
  mapWidth,
  onMove,
  onSelect,
  otherTokenPositions = EMPTY_OTHER_TOKEN_POSITIONS,
  player,
  position,
  rearrangeMode = false,
  roles = [],
  rolesConfirmed = false,
  showRoleDetails = false,
  suspicion,
  tokenScale = 1,
  tokenSize: tokenSizeProp,
}: PlayerTokenProps) {
  const [isDragReady, setIsDragReady] = useState(false);
  const tokenSize = getTokenSize(tokenSizeProp) * tokenScale;
  const borderWidth = isSelected ? SELECTED_BORDER_WIDTH : DEFAULT_BORDER_WIDTH;
  const displayedRoles =
    rolesConfirmed && confirmedRoleIds
      ? roles.filter((role) => confirmedRoleIds.includes(role.id))
      : roles;
  const visibleRoles = showRoleDetails ? displayedRoles : displayedRoles.filter(isTravelerRole);
  const backgroundRole = visibleRoles.find(isTravelerRole) ?? visibleRoles[0];
  const roleIconSource = useRoleIconSource(backgroundRole);
  const reduceMotion = useReducedMotion();
  const hasDeadVote = !!player.death && (deadVoteAvailable ?? player.deadVoteUsed !== true);
  const badgeSize = Math.min(MAX_BADGE_SIZE, tokenSize * BADGE_SIZE_RATIO);
  const suspicionDotSize = badgeSize * SUSPICION_DOT_RATIO;
  // On the border at the top right (45°), measured from the token's padding box.
  const suspicionDotReach = (tokenSize / 2) * Math.SQRT1_2;
  const suspicionDotLeft = tokenSize / 2 + suspicionDotReach - borderWidth - suspicionDotSize / 2;
  const suspicionDotTop = tokenSize / 2 - suspicionDotReach - borderWidth - suspicionDotSize / 2;
  const x = useSharedValue(position.x);
  const y = useSharedValue(position.y);
  const startX = useSharedValue(position.x);
  const startY = useSharedValue(position.y);
  const otherPositionsShared = useSharedValue<OtherTokenPosition[]>(otherTokenPositions);

  useEffect(() => {
    x.value = reduceMotion ? position.x : withSpring(position.x);
    y.value = reduceMotion ? position.y : withSpring(position.y);
    startX.value = position.x;
    startY.value = position.y;
  }, [position.x, position.y, reduceMotion, startX, startY, x, y]);

  useEffect(() => {
    otherPositionsShared.value = otherTokenPositions;
  }, [otherTokenPositions, otherPositionsShared]);

  // Worklet: clamp the proposed center so it doesn't overlap any other token.
  // For each blocker, project the proposed center onto the boundary circle of
  // the blocker (radius = half of both token sizes) along the vector from blocker to proposed
  // center. Pick the candidate closest to the original proposed center — that
  // is the one furthest along the drag direction, so the dragged token stops
  // at the first blocker it actually hits.
  function clampToOtherTokens(px: number, py: number) {
    'worklet';

    const blockers = otherPositionsShared.value;
    let bestX = px;
    let bestY = py;
    let bestDistanceSquared = Infinity;
    for (let i = 0; i < blockers.length; i += 1) {
      const blocker = blockers[i];
      const dx = px - blocker.x;
      const dy = py - blocker.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (tokenSize + (blocker.size ?? tokenSize)) / 2;
      if (distance >= minDistance) {
        continue;
      }
      if (distance === 0) {
        // Coincident centers: nudge along +x by exactly minDistance.
        const candidateX = blocker.x + minDistance;
        const candidateY = blocker.y;
        const candidateDistanceSquared = (candidateX - px) ** 2 + (candidateY - py) ** 2;
        if (candidateDistanceSquared < bestDistanceSquared) {
          bestX = candidateX;
          bestY = candidateY;
          bestDistanceSquared = candidateDistanceSquared;
        }
        continue;
      }
      const candidateX = blocker.x + (dx / distance) * minDistance;
      const candidateY = blocker.y + (dy / distance) * minDistance;
      const candidateDistanceSquared = (candidateX - px) ** 2 + (candidateY - py) ** 2;
      if (candidateDistanceSquared < bestDistanceSquared) {
        bestX = candidateX;
        bestY = candidateY;
        bestDistanceSquared = candidateDistanceSquared;
      }
    }
    return { x: bestX, y: bestY };
  }

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
      runOnJS(setIsDragReady)(true);
    })
    .onUpdate((event) => {
      const clamped = clampTokenPosition(
        {
          x: startX.value + event.translationX / mapScale,
          y: startY.value + event.translationY / mapScale,
        },
        mapWidth,
        mapHeight,
        tokenSize,
        borderWidth,
      );
      const blocked = clampToOtherTokens(clamped.x, clamped.y);

      x.value = blocked.x;
      y.value = blocked.y;
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
        accessible
        accessibilityHint={
          rearrangeMode ? 'Drag to rearrange this player.' : 'Double tap to select.'
        }
        accessibilityLabel={`${player.name}${player.isStoryteller ? ', storyteller' : ''}${player.death ? ', dead' : ''}${hasDeadVote ? ', has dead vote' : ''}${visibleRoles.length > 0 ? `, ${visibleRoles.map((role) => role.name).join(', ')}` : ''}`}
        accessibilityActions={[{ name: 'activate', label: 'Select player' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'activate' && onSelect && !disabled) {
            onSelect(player.id);
          }
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled, selected: isSelected }}
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
            borderWidth,
            opacity: disabled ? 0.42 : dimmed ? 0.28 : player.death && !isDragReady ? 0.72 : 1,
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
            source={roleIconSource}
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: tokenSize / 2,
                filter: backgroundRole.redTint ? [{ hueRotate: '150deg' }] : undefined,
                overflow: 'hidden',
              },
            ]}
            imageStyle={[styles.roleImage, { borderRadius: tokenSize / 2 }]}
          />
        ) : null}
        <View style={styles.content}>
          <PlayerTokenContent
            color={
              isDragReady
                ? Colors.textDragReady
                : player.death
                  ? Colors.textDeath
                  : Colors.textDefault
            }
            isStoryteller={player.isStoryteller}
            name={displayName ?? player.name}
            roles={visibleRoles}
          />
        </View>
        {suspicion ? (
          <View
            style={[
              styles.suspicionDot,
              suspicionDotStyles[suspicion],
              {
                borderRadius: suspicionDotSize / 2,
                height: suspicionDotSize,
                left: suspicionDotLeft,
                top: suspicionDotTop,
                width: suspicionDotSize,
              },
            ]}
          />
        ) : null}
        {hasDeadVote ? (
          <View
            style={[
              styles.deadVoteBadge,
              {
                borderRadius: badgeSize / 2,
                bottom: -borderWidth,
                height: badgeSize,
                left: tokenSize / 2 - borderWidth - badgeSize / 2,
                width: badgeSize,
              },
            ]}
          >
            <DeadVoteIcon color={badgeColors.deadVoteIcon} size={badgeSize * 0.7} />
          </View>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

function PlayerTokenContent({
  color,
  isStoryteller,
  name,
  roles,
}: {
  color: string;
  isStoryteller?: boolean;
  name: string;
  roles: Role[];
}) {
  const roleDetails = roles.length > 0 ? <PlayerTokenRoles color={color} roles={roles} /> : null;

  return (
    <>
      {roleDetails}
      {isStoryteller ? <PlayerTokenLabel color={color} /> : null}
      <PlayerTokenName color={color} name={name} />
    </>
  );
}

function PlayerTokenLabel({ color }: { color: string }) {
  return (
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.8}
      numberOfLines={1}
      style={[styles.storytellerLabel, getStorytellerLabelColorStyle(color)]}
    >
      Storyteller
    </Text>
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
      style={[styles.name, { color }]}
    >
      {name}
    </Text>
  );
}

function PlayerTokenRoles({ color, roles }: { color: string; roles: Role[] }) {
  return (
    <View style={styles.roles}>
      <Text
        adjustsFontSizeToFit
        ellipsizeMode="tail"
        minimumFontScale={0.6}
        numberOfLines={1}
        selectable
        style={[styles.rolesText, { color }]}
      >
        {roles.map((role) => role.name).join(' / ')}
      </Text>
    </View>
  );
}

function getStorytellerLabelColorStyle(color: string) {
  if (color === Colors.textDeath) {
    return styles.storytellerLabelDeath;
  }

  if (color === Colors.textDragReady) {
    return styles.storytellerLabelDragReady;
  }

  return styles.storytellerLabelDefault;
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    zIndex: 1,
  },
  suspicionDot: {
    borderColor: colors.gameBackground,
    borderWidth: 1.5,
    position: 'absolute',
  },
  suspectDot: { backgroundColor: colors.suspicionSuspect },
  trustedDot: { backgroundColor: colors.suspicionTrusted },
  unsureDot: { backgroundColor: colors.suspicionUnsure },
  deadVoteBadge: {
    alignItems: 'center',
    backgroundColor: badgeColors.deadVoteBackground,
    justifyContent: 'center',
    position: 'absolute',
  },
  name: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 13,
    textAlign: 'center',
  },
  roleImage: {
    opacity: ROLE_IMAGE_OPACITY,
    transform: [{ scale: ROLE_IMAGE_SCALE }],
  },
  roles: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 1,
    maxWidth: '100%',
  },
  rolesText: {
    flexShrink: 1,
    fontSize: 8.5,
    fontWeight: '900',
    lineHeight: 10,
    textAlign: 'center',
  },
  storytellerLabel: {
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 9,
    maxWidth: '100%',
    marginBottom: 1,
    textAlign: 'center',
  },
  storytellerLabelDeath: { color: Colors.textDeath },
  storytellerLabelDefault: { color: Colors.textDefault },
  storytellerLabelDragReady: { color: Colors.textDragReady },
});

const suspicionDotStyles = {
  suspect: styles.suspectDot,
  trusted: styles.trustedDot,
  unsure: styles.unsureDot,
};
