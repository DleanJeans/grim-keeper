import type { Player, PlayerPosition } from '@/types/game';
import { DESKTOP_CONTENT_MAX_WIDTH } from '@/utils/responsive-utils';

export const defaultTokenSize = 68;
export const minTokenSize = 40;
export const maxTokenSize = 100;
export const tokenSizeStep = 2;
export const minMapWidth = 240;
export const maxMapWidth = DESKTOP_CONTENT_MAX_WIDTH;
export const mapWidthStep = 20;
export const minMapHeight = 240;
export const maxMapHeight = 2000;
export const mapHeightStep = 20;

export function getTokenSize(tokenSize = defaultTokenSize) {
  'worklet';

  return Math.min(maxTokenSize, Math.max(minTokenSize, tokenSize));
}

export function getDefaultMapWidth(viewportWidth: number) {
  return Math.max(1, Math.min(DESKTOP_CONTENT_MAX_WIDTH, Math.round(viewportWidth - 40)));
}

export function clampMapWidth(mapWidth: number) {
  return Math.min(maxMapWidth, Math.max(minMapWidth, Math.round(mapWidth)));
}

export function getNextMapDimension(
  currentValue: number,
  sizeDelta: number,
  step: number,
  clamp: (value: number) => number,
) {
  if (sizeDelta === 0) {
    return clamp(currentValue);
  }

  const steppedValue =
    sizeDelta > 0 ? Math.ceil(currentValue / step) * step : Math.floor(currentValue / step) * step;
  const nextValue = steppedValue === currentValue ? currentValue + sizeDelta : steppedValue;

  return clamp(nextValue);
}

export function getLegacyMapHeight(mapWidth: number, viewportHeight: number) {
  return Math.max(mapWidth, Math.floor(viewportHeight * 0.52));
}

export function clampMapHeight(mapHeight: number) {
  const steppedHeight = Math.round(mapHeight / mapHeightStep) * mapHeightStep;

  return Math.min(maxMapHeight, Math.max(minMapHeight, steppedHeight));
}

export function getDefaultMapHeight(mapWidth: number, viewportHeight: number) {
  return clampMapHeight(getLegacyMapHeight(mapWidth, viewportHeight));
}

export function getMapScale(availableWidth: number, mapWidth: number) {
  return Math.max(0.01, availableWidth / Math.max(1, mapWidth));
}

export function getDefaultTokenSize(playerCount: number, mapWidth: number, mapHeight: number) {
  const perimeter = 2 * (Math.max(1, mapWidth) + Math.max(1, mapHeight));
  const slots = Math.max(1, playerCount);

  return getTokenSize(Math.round(perimeter / slots));
}

export function scalePlayerMapPositions(
  players: Player[],
  sourceMapWidth: number,
  sourceMapHeight: number,
  targetMapWidth: number,
  targetMapHeight: number,
  tokenSize = defaultTokenSize,
): Record<string, PlayerPosition> {
  const sourceWidth = Math.max(1, sourceMapWidth);
  const sourceHeight = Math.max(1, sourceMapHeight);

  return Object.fromEntries(
    players.flatMap((player) => {
      if (!player.position) {
        return [];
      }

      return [
        [
          player.id,
          clampTokenPosition(
            {
              x: (player.position.x / sourceWidth) * targetMapWidth,
              y: (player.position.y / sourceHeight) * targetMapHeight,
            },
            targetMapWidth,
            targetMapHeight,
            tokenSize,
          ),
        ],
      ];
    }),
  );
}

export function getPlayerMapPosition(
  player: Player,
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  tokenSize = defaultTokenSize,
): PlayerPosition {
  const resolvedTokenSize = getTokenSize(tokenSize);

  if (player.position) {
    return clampTokenPosition(player.position, mapWidth, mapHeight, resolvedTokenSize);
  }

  const sortedPlayers = [...players].sort((first, second) => first.seat - second.seat);
  const index = sortedPlayers.findIndex((candidate) => candidate.id === player.id);
  const inset = resolvedTokenSize / 2;
  const left = Math.min(inset, mapWidth / 2);
  const right = Math.max(left, mapWidth - inset);
  const top = Math.min(inset, mapHeight / 2);
  const bottom = Math.max(top, mapHeight - inset);
  const width = right - left;
  const height = bottom - top;
  const perimeter = 2 * (width + height);

  if (perimeter === 0) {
    return { x: left, y: top };
  }

  const bottomCenterOffset = width * 1.5 + height;
  const offset =
    (bottomCenterOffset + (perimeter * Math.max(0, index)) / Math.max(1, sortedPlayers.length)) %
    perimeter;

  if (offset <= width) {
    return { x: left + offset, y: top };
  }

  if (offset <= width + height) {
    return { x: right, y: top + offset - width };
  }

  if (offset <= 2 * width + height) {
    return { x: right - (offset - width - height), y: bottom };
  }

  return {
    x: left,
    y: bottom - (offset - 2 * width - height),
  };
}

export function clampTokenPosition(
  position: PlayerPosition,
  mapWidth: number,
  mapHeight: number,
  tokenSize = defaultTokenSize,
  edgeInset = 0,
): PlayerPosition {
  'worklet';

  const inset = getTokenSize(tokenSize) / 2 + edgeInset;
  const maxX = Math.max(inset, mapWidth - inset);
  const maxY = Math.max(inset, mapHeight - inset);

  return {
    x: Math.min(maxX, Math.max(inset, position.x)),
    y: Math.min(maxY, Math.max(inset, position.y)),
  };
}

export type TokenCollisionResolution = {
  /** Map of player id → resolved position. Only includes players whose position changed. */
  positions: Record<string, PlayerPosition>;
};

const COLLISION_RESOLUTION_MAX_ITERATIONS = 16;
const COLLISION_RESOLUTION_EPSILON = 0.5;

type ResolvablePlayer = {
  id: string;
  position: PlayerPosition;
};

/**
 * Resolves overlaps between circular tokens of equal `tokenSize` by pushing the
 * non-anchor token away from the anchor along the line connecting their centers.
 * Repeats until no further overlap is detected (or the iteration cap is hit),
 * which lets pushes cascade through a chain of touching tokens.
 *
 * `anchorId`, if provided, is treated as immovable: other tokens are pushed
 * around it but it is never moved. Other tokens may be pushed out of bounds and
 * clamped to the map edge; the anchor is left at its starting position even
 * when the resulting residual overlap cannot be resolved.
 */
export function resolveTokenCollisions(
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  tokenSize: number,
  anchorId?: string,
): TokenCollisionResolution {
  const resolvedTokenSize = getTokenSize(tokenSize);
  const minDistance = resolvedTokenSize;

  const positions = new Map<string, PlayerPosition>();
  for (const player of players) {
    // Players without a position haven't been placed on the map yet. They
    // get their default placement from getPlayerMapPosition, so we leave
    // them out of the collision math entirely — otherwise they'd be treated
    // as overlapping at (0, 0) and pushed around in a way that "teleports"
    // them to a real position on the perimeter.
    if (player.position) {
      positions.set(player.id, player.position);
    }
  }

  if (positions.size < 2) {
    return { positions: {} };
  }

  const resolved: Record<string, PlayerPosition> = {};

  const setResolved = (id: string, next: PlayerPosition) => {
    positions.set(id, next);
    resolved[id] = next;
  };

  const anchorHasPosition = anchorId !== undefined && positions.has(anchorId);

  for (let iteration = 0; iteration < COLLISION_RESOLUTION_MAX_ITERATIONS; iteration += 1) {
    let movedThisIteration = false;
    // Read positions from the live map (not the input) so updates from
    // earlier iterations are visible here.
    const movablePlayers: ResolvablePlayer[] = players
      .filter((player) => player.id !== anchorId && positions.has(player.id))
      .map((player) => {
        const pos = positions.get(player.id) as PlayerPosition;
        return { id: player.id, position: pos };
      });

    for (let i = 0; i < movablePlayers.length; i += 1) {
      for (let j = i + 1; j < movablePlayers.length; j += 1) {
        const a = movablePlayers[i];
        const b = movablePlayers[j];
        const ax = a.position.x;
        const ay = a.position.y;
        const bx = b.position.x;
        const by = b.position.y;
        const dx = bx - ax;
        const dy = by - ay;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance >= minDistance - COLLISION_RESOLUTION_EPSILON) {
          continue;
        }

        const directionX = distance === 0 ? 1 : dx / distance;
        const directionY = distance === 0 ? 0 : dy / distance;
        // Split the overlap evenly so both sides move the same amount. When
        // one of the pair is the anchor, push the movable side by the full
        // overlap instead.
        const overlap = minDistance - distance;
        const pushAMagnitude = anchorId === b.id ? overlap : overlap / 2;
        const pushBMagnitude = anchorId === a.id ? overlap : overlap / 2;

        const newAx = ax - directionX * pushAMagnitude;
        const newAy = ay - directionY * pushAMagnitude;
        const newBx = bx + directionX * pushBMagnitude;
        const newBy = by + directionY * pushBMagnitude;

        const clampedA = clampTokenPosition(
          { x: newAx, y: newAy },
          mapWidth,
          mapHeight,
          resolvedTokenSize,
        );
        const clampedB = clampTokenPosition(
          { x: newBx, y: newBy },
          mapWidth,
          mapHeight,
          resolvedTokenSize,
        );

        a.position = clampedA;
        b.position = clampedB;
        setResolved(a.id, clampedA);
        setResolved(b.id, clampedB);
        movedThisIteration = true;
      }

      // Also check movable player against the anchor (if any) so the
      // anchor's immovable position still shoves its neighbors aside.
      if (anchorHasPosition) {
        const movable = movablePlayers[i];
        const anchor = positions.get(anchorId as string) as PlayerPosition;
        const dx = movable.position.x - anchor.x;
        const dy = movable.position.y - anchor.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance - COLLISION_RESOLUTION_EPSILON) {
          const overlap = minDistance - distance;
          const directionX = distance === 0 ? 1 : dx / distance;
          const directionY = distance === 0 ? 0 : dy / distance;
          const newPos = clampTokenPosition(
            {
              x: movable.position.x + directionX * overlap,
              y: movable.position.y + directionY * overlap,
            },
            mapWidth,
            mapHeight,
            resolvedTokenSize,
          );
          movable.position = newPos;
          setResolved(movable.id, newPos);
          movedThisIteration = true;
        }
      }
    }

    if (!movedThisIteration) {
      break;
    }
  }

  return { positions: resolved };
}

export function rotatePlayerMapPositions(
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  angleRadians: number,
  tokenSize = defaultTokenSize,
): Record<string, PlayerPosition> {
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return Object.fromEntries(
    players.map((player) => {
      const position = getPlayerMapPosition(player, players, mapWidth, mapHeight, tokenSize);
      const relativeX = position.x - centerX;
      const relativeY = position.y - centerY;

      return [
        player.id,
        clampTokenPosition(
          {
            x: centerX + relativeX * cos - relativeY * sin,
            y: centerY + relativeX * sin + relativeY * cos,
          },
          mapWidth,
          mapHeight,
          tokenSize,
        ),
      ];
    }),
  );
}
