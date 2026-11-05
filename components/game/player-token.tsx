import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { GrimoireTokenFace } from '@/components/game/grimoire-token-face';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useRoleIconSource } from '@/hooks/use-role-icon-source';
import { colors } from '@/theme/colors';
import type { Player, PlayerPosition, Role } from '@/types/game';
import { type ClaimOrbitObstacle, getClaimOrbitLayout } from '@/utils/claim-orbit-utils';
import { clampTokenPosition, getTokenSize } from '@/utils/layout-utils';
import { isTravelerRole } from '@/utils/role-utils';
import type { SuspicionLevel } from '@/utils/suspicion-utils';

const MAX_BADGE_SIZE = 18;
const BADGE_SIZE_RATIO = 0.22;
const DEFAULT_BORDER_WIDTH = 2;
const SUSPICION_DOT_RATIO = 0.75;
// Character icon in the middle of the token, as a share of the token's size.
const ROLE_ICON_RATIO = 0.56;
// Claim tokens sit along the top and stay above this share of the token below its center.
const CLAIM_BAND_RATIO = 0.05;
const DEAD_OPACITY = 0.85;
const CLAIM_TOKEN_BORDER_WIDTH = 1;
const EMPTY_OTHER_TOKEN_POSITIONS: OtherTokenPosition[] = [];
const badgeColors = colors.playerTokenEdgeBadge;

/** Center of another token on the map; `size` defaults to this token's size. */
export type OtherTokenPosition = { size?: number; x: number; y: number };

type PlayerTokenProps = {
  /** Claimed characters drawn as small tokens along the inside edge. */
  claimRoles?: Role[];
  mapHeight: number;
  mapScale: number;
  mapWidth: number;
  confirmedRoleIds?: string[];
  deadVoteAvailable?: boolean;
  disabled?: boolean;
  /** Faded but still tappable, e.g. cleared players under the suspect filter. */
  dimmed?: boolean;
  /** Red ring: evil in the selected theory. */
  theoryEvil?: boolean;
  /** Short word shown under the token, such as "drunk?". */
  label?: string;
  /** Small gold dot at the top left: you saved notes about this player in other games. */
  hasLessons?: boolean;
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
  claimRoles,
  confirmedRoleIds,
  deadVoteAvailable,
  dimmed = false,
  disabled = false,
  displayName,
  hasLessons = false,
  isInitiator = false,
  isSelected = false,
  label,
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
  theoryEvil = false,
  tokenScale = 1,
  tokenSize: tokenSizeProp,
}: PlayerTokenProps) {
  const [isDragReady, setIsDragReady] = useState(false);
  const tokenSize = getTokenSize(tokenSizeProp) * tokenScale;
  const borderWidth = DEFAULT_BORDER_WIDTH;
  const displayedRoles =
    rolesConfirmed && confirmedRoleIds
      ? roles.filter((role) => confirmedRoleIds.includes(role.id))
      : roles;
  const visibleRoles = showRoleDetails ? displayedRoles : displayedRoles.filter(isTravelerRole);
  // Several claims show as claim tokens, so none of them is painted behind the name.
  const hasMultipleClaims = (claimRoles?.length ?? 0) > 1;
  const backgroundRole =
    visibleRoles.find(isTravelerRole) ?? (hasMultipleClaims ? undefined : visibleRoles[0]);
  // Their names too: the claim tokens stand in for the "A / B / C" line.
  const nameRoles = hasMultipleClaims ? visibleRoles.filter(isTravelerRole) : visibleRoles;
  const roleIconSource = useRoleIconSource(backgroundRole);
  const reduceMotion = useReducedMotion();
  const hasDeadVote = !!player.death && (deadVoteAvailable ?? player.deadVoteUsed !== true);
  const badgeSize = Math.min(MAX_BADGE_SIZE, tokenSize * BADGE_SIZE_RATIO);
  const suspicionDotSize = badgeSize * SUSPICION_DOT_RATIO;
  // Badges sit on the edge at 45°: the suspicion dot top right, the dead vote bottom right.
  const edgeReach = (tokenSize / 2) * Math.SQRT1_2;
  const claimObstacles: ClaimOrbitObstacle[] = [];
  if (hasDeadVote) {
    claimObstacles.push({ radius: badgeSize / 2, x: edgeReach, y: edgeReach });
  }
  if (suspicion) {
    claimObstacles.push({ radius: suspicionDotSize / 2, x: edgeReach, y: -edgeReach });
  }
  // The lessons dot mirrors the suspicion dot at the top left.
  if (hasLessons) {
    claimObstacles.push({ radius: suspicionDotSize / 2, x: -edgeReach, y: -edgeReach });
  }
  // The name runs along the bottom, so claim tokens group along the top: lay them out as if at
  // the bottom with everything flipped upside down, then flip them back.
  const flippedClaimLayout = claimRoles?.length
    ? getClaimOrbitLayout({
        borderWidth,
        count: claimRoles.length,
        obstacles: claimObstacles.map((obstacle) => ({ ...obstacle, y: -obstacle.y })),
        textHalfHeight: tokenSize * CLAIM_BAND_RATIO,
        tokenSize,
      })
    : undefined;
  const claimLayout = flippedClaimLayout
    ? {
        positions: flippedClaimLayout.positions.map((claim) => ({ x: claim.x, y: -claim.y })),
        size: flippedClaimLayout.size,
      }
    : undefined;
  const hasClaimTokens = (claimLayout?.positions.length ?? 0) > 0;
  const topText = player.isStoryteller
    ? 'Storyteller'
    : nameRoles.length > 0
      ? nameRoles.map((role) => role.name).join(' / ')
      : undefined;
  const roleIconSize = tokenSize * ROLE_ICON_RATIO;
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
          styles.token,
          {
            height: tokenSize,
            opacity: disabled
              ? 0.42
              : dimmed
                ? 0.28
                : player.death && !isDragReady
                  ? DEAD_OPACITY
                  : 1,
            width: tokenSize,
          },
          animatedStyle,
        ]}
      >
        <GrimoireTokenFace
          compactInitial={hasClaimTokens}
          dead={!!player.death}
          id={player.id}
          layer="base"
          name={displayName ?? player.name}
          ring={
            isDragReady ? 'drag' : isSelected ? 'selected' : isInitiator ? 'initiator' : undefined
          }
          showInitial={!backgroundRole}
          size={tokenSize}
          storyteller={!!player.isStoryteller}
          topText={topText}
        />
        {backgroundRole ? (
          <View
            style={[
              styles.roleIcon,
              backgroundRole.redTint && styles.redTint,
              player.death && styles.roleIconDead,
              {
                height: roleIconSize,
                left: (tokenSize - roleIconSize) / 2,
                top: (tokenSize - roleIconSize) / 2,
                width: roleIconSize,
              },
            ]}
          >
            <Image resizeMode="contain" source={roleIconSource} style={styles.roleIconImage} />
          </View>
        ) : null}
        <GrimoireTokenFace
          compactInitial={hasClaimTokens}
          dead={!!player.death}
          id={player.id}
          layer="drape"
          name={displayName ?? player.name}
          ring={
            isDragReady ? 'drag' : isSelected ? 'selected' : isInitiator ? 'initiator' : undefined
          }
          showInitial={!backgroundRole}
          size={tokenSize}
          storyteller={!!player.isStoryteller}
          topText={topText}
        />
        {claimRoles && claimLayout
          ? claimLayout.positions.map((claimPosition, index) => (
              <PlayerTokenClaim
                // biome-ignore lint/suspicious/noArrayIndexKey: one claim per slot.
                key={index}
                left={tokenSize / 2 + claimPosition.x - claimLayout.size / 2}
                role={claimRoles[index]}
                size={claimLayout.size}
                top={tokenSize / 2 + claimPosition.y - claimLayout.size / 2}
              />
            ))
          : null}
        {suspicion ? (
          <View
            style={[
              styles.suspicionDot,
              suspicionDotStyles[suspicion],
              {
                borderRadius: suspicionDotSize / 2,
                height: suspicionDotSize,
                left: tokenSize / 2 + edgeReach - suspicionDotSize / 2,
                top: tokenSize / 2 - edgeReach - suspicionDotSize / 2,
                width: suspicionDotSize,
              },
            ]}
          />
        ) : null}
        {hasLessons ? (
          <View
            accessibilityLabel="Has saved notes"
            style={[
              styles.suspicionDot,
              styles.lessonsDot,
              {
                borderRadius: suspicionDotSize / 2,
                height: suspicionDotSize,
                left: tokenSize / 2 - edgeReach - suspicionDotSize / 2,
                top: tokenSize / 2 - edgeReach - suspicionDotSize / 2,
                width: suspicionDotSize,
              },
            ]}
          />
        ) : null}
        {theoryEvil ? (
          <View
            style={[
              styles.theoryRing,
              {
                borderRadius: tokenSize / 2 + 4,
                height: tokenSize + 8,
                left: -4,
                top: -4,
                width: tokenSize + 8,
              },
            ]}
          />
        ) : null}
        {label ? (
          <View
            style={[
              styles.tokenLabelWrap,
              {
                left: -tokenSize / 2,
                top: tokenSize + 2,
                width: tokenSize * 2,
              },
            ]}
          >
            <Text numberOfLines={1} style={styles.tokenLabel}>
              {label}
            </Text>
          </View>
        ) : null}
        {hasDeadVote ? (
          <View
            style={[
              styles.deadVoteBadge,
              {
                borderRadius: badgeSize / 2,
                height: badgeSize,
                left: tokenSize / 2 + edgeReach - badgeSize / 2,
                top: tokenSize / 2 + edgeReach - badgeSize / 2,
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

function PlayerTokenClaim({
  left,
  role,
  size,
  top,
}: {
  left: number;
  role: Role;
  size: number;
  top: number;
}) {
  return (
    <View
      style={[styles.claimToken, { borderRadius: size / 2, height: size, left, top, width: size }]}
    >
      <RoleIcon role={role} scale={1.25} size={size - CLAIM_TOKEN_BORDER_WIDTH * 2} />
    </View>
  );
}

const styles = StyleSheet.create({
  claimToken: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleClaim,
    borderWidth: CLAIM_TOKEN_BORDER_WIDTH,
    justifyContent: 'center',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: 1,
  },
  suspicionDot: {
    borderColor: colors.gameBackground,
    borderWidth: 1.5,
    position: 'absolute',
  },
  suspectDot: { backgroundColor: colors.suspicionSuspect },
  tokenLabel: {
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.gameText,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  theoryRing: {
    borderColor: colors.theoryEvil,
    borderWidth: 3,
    pointerEvents: 'none',
    position: 'absolute',
  },
  tokenLabelWrap: { alignItems: 'center', pointerEvents: 'none', position: 'absolute', zIndex: 3 },
  trustedDot: { backgroundColor: colors.suspicionTrusted },
  unsureDot: { backgroundColor: colors.suspicionUnsure },
  deadVoteBadge: {
    alignItems: 'center',
    backgroundColor: badgeColors.deadVoteBackground,
    justifyContent: 'center',
    position: 'absolute',
  },
  lessonsDot: { backgroundColor: colors.savedNoteIcon },
  redTint: { filter: [{ hueRotate: '150deg' }] },
  roleIcon: { pointerEvents: 'none', position: 'absolute' },
  roleIconDead: { opacity: 0.55 },
  roleIconImage: { height: '100%', width: '100%' },
  token: { position: 'absolute', zIndex: 2 },
});

const suspicionDotStyles = {
  suspect: styles.suspectDot,
  trusted: styles.trustedDot,
  unsure: styles.unsureDot,
};
