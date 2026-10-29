import { G, Path, Polygon } from 'react-native-svg';

import type { PlayerPosition } from '@/types/game';
import { getTokenSize } from '@/utils/layout-utils';

const TOKEN_GAP = 3;
const BLOCKER_MARGIN = 6;
const ARROW_SPREAD = Math.PI / 6;
// Stroke width around the arrowhead that rounds its corners.
const ARROW_ROUNDING = 3;
// How far the rounded corner pokes past the arrowhead's sharp tip.
const ARROW_TIP_INSET = ARROW_ROUNDING / 2 / Math.sin(ARROW_SPREAD);
// Control point offsets, as a fraction of the distance between the two tokens.
// Angles (radians) to slide a line end around its token, nearest first.
const END_SLIDE_ANGLES = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6, 0.8, -0.8];
const BEND_STEPS = [0, 0.1, 0.18, 0.26, 0.35, 0.45, 0.6, 0.8, 1];
// Control point offsets for touching tokens, in token radii, so the line loops out past the gap.
const TOUCHING_BEND_RADII = [1.8, 2.3, 2.8];
// Straight pieces each curve is split into when checking whether two curves cross.
const CROSSING_SAMPLES = 32;

export type PlacedLineEnd = { base: PlayerPosition; tip: PlayerPosition };

export function getInteractionCurvePlayerPairs(conversation: { participantIds: string[] }) {
  const playerIds = [...new Set(conversation.participantIds)];
  const pairs: [string, string][] = [];

  for (let index = 0; index < playerIds.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < playerIds.length; nextIndex += 1) {
      pairs.push([playerIds[index], playerIds[nextIndex]]);
    }
  }

  return pairs;
}

export function ConnectionCurve({
  blockers,
  from,
  mapHeight,
  mapWidth,
  opacity = 0.9,
  stroke,
  strokeWidth,
  placedLineEnds,
  placedPaths,
  to,
  tokenSize,
  twoWay = false,
}: {
  blockers: PlayerPosition[];
  from?: PlayerPosition;
  mapHeight: number;
  mapWidth: number;
  opacity?: number;
  stroke: string;
  strokeWidth: number;
  to?: PlayerPosition;
  tokenSize: number;
  /**
   * Line ends drawn so far on this map. The curve bends to keep its own ends, arrowheads
   * included, away from them, then adds its own.
   */
  placedLineEnds?: PlacedLineEnd[];
  /** Curves drawn so far on this map, as points along them. The curve bends to avoid crossing them. */
  placedPaths?: PlayerPosition[][];
  /** Draw an arrowhead at both ends, for two players pointing at each other. */
  twoWay?: boolean;
}) {
  if (!from || !to) {
    return null;
  }

  const curve = getConversationCurve(
    from,
    to,
    mapWidth,
    mapHeight,
    tokenSize,
    strokeWidth,
    blockers,
    twoWay,
    placedLineEnds ?? [],
    placedPaths ?? [],
  );

  if (!curve) {
    return null;
  }

  // One group opacity so the line and arrowhead don't darken where they meet.
  return (
    <G opacity={opacity}>
      {curve.path ? (
        <Path
          d={curve.path}
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      ) : null}
      {curve.arrowPoints.map((points) => (
        <Polygon
          key={points}
          fill={stroke}
          points={points}
          stroke={stroke}
          strokeLinejoin="round"
          strokeWidth={ARROW_ROUNDING}
        />
      ))}
    </G>
  );
}

function getConversationCurve(
  from: PlayerPosition,
  to: PlayerPosition,
  mapWidth: number,
  mapHeight: number,
  tokenSize: number,
  strokeWidth: number,
  blockers: PlayerPosition[],
  twoWay: boolean,
  placedLineEnds: PlacedLineEnd[],
  placedPaths: PlayerPosition[][],
) {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);

  if (distance <= 0) {
    return null;
  }

  const tokenRadius = getTokenSize(tokenSize) / 2;
  const edgeRadius = tokenRadius + TOKEN_GAP;
  const blockerRadius = tokenRadius + BLOCKER_MARGIN;
  const arrowLength = 5 + strokeWidth * 2.5;
  // Arrowhead width plus a little air, so two line ends never touch.
  const endSpacing = 2 * (arrowLength * Math.tan(ARROW_SPREAD) + ARROW_ROUNDING / 2) + 6;
  const headLength = arrowLength + ARROW_TIP_INSET;
  const center = { x: mapWidth / 2, y: mapHeight / 2 };
  const midpoint = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const normal = { x: -(to.y - from.y) / distance, y: (to.x - from.x) / distance };
  // Bend toward the middle of the map first so curves stay inside the circle.
  const inwardSide =
    normal.x * (center.x - midpoint.x) + normal.y * (center.y - midpoint.y) >= 0 ? 1 : -1;

  // Tokens too close for a line and its arrowheads between them loop out to the side instead,
  // toward the middle of the map first like other curves.
  const isTouching = distance - 2 * edgeRadius < headLength * (twoWay ? 3 : 2);
  const offsets = isTouching
    ? TOUCHING_BEND_RADII.map((radii) => radii * edgeRadius)
    : BEND_STEPS.map((step) => step * distance);
  const sides = [inwardSide, -inwardSide];

  let best: { control: PlayerPosition; hits: number } | null = null;

  for (const bend of offsets) {
    for (const side of bend === 0 ? [1] : sides) {
      const offset = bend * side;
      const control = { x: midpoint.x + normal.x * offset, y: midpoint.y + normal.y * offset };
      const start = getTokenEdgePoint(from, control, edgeRadius);
      const end = getTokenEdgePoint(to, control, edgeRadius);
      const apex = getQuadraticPoint(start, control, end, 0.5);
      const outsideMap = apex.x < 0 || apex.y < 0 || apex.x > mapWidth || apex.y > mapHeight;
      const hits =
        countBlockersHit(start, control, end, blockers, blockerRadius) +
        countLineEndsCrossed(start, control, end, placedLineEnds, endSpacing / 2, headLength) +
        countPathsCrossed(start, control, end, placedPaths, headLength) +
        (outsideMap ? 1 : 0);

      if (!best || hits < best.hits) {
        best = { control, hits };
      }
      if (hits === 0) {
        break;
      }
    }
    if (best?.hits === 0) {
      break;
    }
  }

  const control = best?.control ?? midpoint;
  // Slide each end around its token when another line already ends there.
  const startEnd = getClearLineEnd(
    from,
    control,
    edgeRadius,
    headLength,
    placedLineEnds,
    endSpacing,
  );
  const endEnd = getClearLineEnd(to, control, edgeRadius, headLength, placedLineEnds, endSpacing);
  const startTip = startEnd.tip;
  const endTip = endEnd.tip;

  placedLineEnds.push(startEnd, endEnd);
  placedPaths.push(getQuadraticSamples(startTip, control, endTip));

  if (Math.hypot(endTip.x - startTip.x, endTip.y - startTip.y) <= headLength * (twoWay ? 2 : 1)) {
    return {
      arrowPoints: twoWay
        ? [
            getArrowPoints(endTip, startTip, arrowLength),
            getArrowPoints(startTip, endTip, arrowLength),
          ]
        : [getArrowPoints(endTip, startTip, arrowLength)],
      path: null,
    };
  }

  // Stop the line at each arrowhead's base instead of running under it.
  const endProgress = getProgressAtDistanceFromEnd(startTip, control, endTip, headLength);
  const startProgress = twoWay
    ? 1 - getProgressAtDistanceFromEnd(endTip, control, startTip, headLength)
    : 0;
  const lineStart = getQuadraticPoint(startTip, control, endTip, startProgress);
  const lineEnd = getQuadraticPoint(startTip, control, endTip, endProgress);
  const lineControl = getQuadraticBlossom(startTip, control, endTip, startProgress, endProgress);
  const arrowPoints = [getArrowPoints(endTip, lineEnd, arrowLength)];

  if (twoWay) {
    arrowPoints.push(getArrowPoints(startTip, lineStart, arrowLength));
  }

  return {
    arrowPoints,
    path: `M ${lineStart.x} ${lineStart.y} Q ${lineControl.x} ${lineControl.y} ${lineEnd.x} ${lineEnd.y}`,
  };
}

function getTokenEdgePoint(tokenCenter: PlayerPosition, toward: PlayerPosition, radius: number) {
  const deltaX = toward.x - tokenCenter.x;
  const deltaY = toward.y - tokenCenter.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= 0) {
    return tokenCenter;
  }

  return {
    x: tokenCenter.x + (deltaX / distance) * radius,
    y: tokenCenter.y + (deltaY / distance) * radius,
  };
}

/** Where a line meets a token edge (`tip`) and roughly where its arrowhead ends (`base`). */
function getClearLineEnd(
  tokenCenter: PlayerPosition,
  toward: PlayerPosition,
  radius: number,
  headLength: number,
  placedLineEnds: PlacedLineEnd[],
  spacing: number,
): PlacedLineEnd {
  const angle = Math.atan2(toward.y - tokenCenter.y, toward.x - tokenCenter.x);
  // Line ends already on this token, by their angle around it.
  const tokenEndAngles = placedLineEnds
    .filter(
      (placed) =>
        Math.hypot(placed.tip.x - tokenCenter.x, placed.tip.y - tokenCenter.y) <= radius + 1,
    )
    .map((placed) => Math.atan2(placed.tip.y - tokenCenter.y, placed.tip.x - tokenCenter.x));
  let lineEnd: PlacedLineEnd | null = null;

  for (const shift of END_SLIDE_ANGLES) {
    // Never slide past another line end on this token, which would make the two lines cross.
    const keepsOrder = tokenEndAngles.every(
      (placedAngle) =>
        Math.sign(getAngleDifference(angle, placedAngle)) ===
        Math.sign(getAngleDifference(angle + shift, placedAngle)),
    );
    if (!keepsOrder) {
      continue;
    }

    const tip = {
      x: tokenCenter.x + Math.cos(angle + shift) * radius,
      y: tokenCenter.y + Math.sin(angle + shift) * radius,
    };
    const toControl = Math.hypot(toward.x - tip.x, toward.y - tip.y) || 1;
    const base = {
      x: tip.x + ((toward.x - tip.x) / toControl) * headLength,
      y: tip.y + ((toward.y - tip.y) / toControl) * headLength,
    };
    lineEnd = { base, tip };

    if (placedLineEnds.every((placed) => getSegmentGap(lineEnd ?? placed, placed) >= spacing)) {
      return lineEnd;
    }
  }

  return { base: toward, tip: getTokenEdgePoint(tokenCenter, toward, radius) };
}

/** Signed difference between two angles, in (-π, π]. */
function getAngleDifference(first: number, second: number) {
  const difference = (first - second) % (2 * Math.PI);
  if (difference > Math.PI) return difference - 2 * Math.PI;
  if (difference <= -Math.PI) return difference + 2 * Math.PI;
  return difference;
}

/** Smallest distance between two short segments, sampled along both. */
function getSegmentGap(first: PlacedLineEnd, second: PlacedLineEnd) {
  const samples = 4;
  let gap = Number.POSITIVE_INFINITY;

  for (let index = 0; index <= samples; index += 1) {
    const firstPoint = lerp(first.tip, first.base, index / samples);

    for (let otherIndex = 0; otherIndex <= samples; otherIndex += 1) {
      const secondPoint = lerp(second.tip, second.base, otherIndex / samples);
      gap = Math.min(gap, Math.hypot(firstPoint.x - secondPoint.x, firstPoint.y - secondPoint.y));
    }
  }

  return gap;
}

function lerp(from: PlayerPosition, to: PlayerPosition, progress: number): PlayerPosition {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
}

function getArrowPoints(tip: PlayerPosition, base: PlayerPosition, length: number) {
  const angle = Math.atan2(tip.y - base.y, tip.x - base.x);
  // Pull the sharp tip back so the rounded one lands on `tip`.
  const sharpTip = {
    x: tip.x - Math.cos(angle) * ARROW_TIP_INSET,
    y: tip.y - Math.sin(angle) * ARROW_TIP_INSET,
  };
  // Each side is longer than the arrow so the base sits exactly `length` behind the sharp tip.
  const side = length / Math.cos(ARROW_SPREAD);

  return [
    `${sharpTip.x},${sharpTip.y}`,
    `${sharpTip.x - Math.cos(angle - ARROW_SPREAD) * side},${sharpTip.y - Math.sin(angle - ARROW_SPREAD) * side}`,
    `${sharpTip.x - Math.cos(angle + ARROW_SPREAD) * side},${sharpTip.y - Math.sin(angle + ARROW_SPREAD) * side}`,
  ].join(' ');
}

function getProgressAtDistanceFromEnd(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  distanceFromEnd: number,
) {
  // Binary search so the line ends exactly at the arrowhead's base, with no gap.
  let near = 0;
  let far = 1;

  for (let step = 0; step < 24; step += 1) {
    const progress = (near + far) / 2;
    const point = getQuadraticPoint(from, control, to, progress);

    if (Math.hypot(point.x - to.x, point.y - to.y) >= distanceFromEnd) {
      near = progress;
    } else {
      far = progress;
    }
  }

  return near;
}

/** Counts earlier line ends (arrowheads included) this curve runs over, away from its own ends. */
function countLineEndsCrossed(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  placedLineEnds: PlacedLineEnd[],
  clearance: number,
  ownEndLength: number,
) {
  const samples = 128;

  return placedLineEnds.filter((placed) => {
    for (let index = 0; index <= samples; index += 1) {
      const point = getQuadraticPoint(from, control, to, index / samples);
      const nearOwnEnd =
        Math.hypot(point.x - from.x, point.y - from.y) < ownEndLength * 1.5 ||
        Math.hypot(point.x - to.x, point.y - to.y) < ownEndLength * 1.5;

      if (!nearOwnEnd && getSegmentGap({ base: point, tip: point }, placed) < clearance) {
        return true;
      }
    }

    return false;
  }).length;
}

/** Counts earlier curves this one crosses, away from its own ends where curves meet their tokens. */
function countPathsCrossed(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  placedPaths: PlayerPosition[][],
  ownEndLength: number,
) {
  const points = getQuadraticSamples(from, control, to).filter(
    (point) =>
      Math.hypot(point.x - from.x, point.y - from.y) >= ownEndLength &&
      Math.hypot(point.x - to.x, point.y - to.y) >= ownEndLength,
  );

  return placedPaths.filter((path) =>
    points.some(
      (point, index) =>
        index > 0 &&
        path.some(
          (pathPoint, pathIndex) =>
            pathIndex > 0 &&
            doSegmentsCross(points[index - 1], point, path[pathIndex - 1], pathPoint),
        ),
    ),
  ).length;
}

function doSegmentsCross(
  firstStart: PlayerPosition,
  firstEnd: PlayerPosition,
  secondStart: PlayerPosition,
  secondEnd: PlayerPosition,
) {
  const side = (from: PlayerPosition, to: PlayerPosition, point: PlayerPosition) =>
    Math.sign((to.x - from.x) * (point.y - from.y) - (to.y - from.y) * (point.x - from.x));

  return (
    side(firstStart, firstEnd, secondStart) * side(firstStart, firstEnd, secondEnd) < 0 &&
    side(secondStart, secondEnd, firstStart) * side(secondStart, secondEnd, firstEnd) < 0
  );
}

function getQuadraticSamples(from: PlayerPosition, control: PlayerPosition, to: PlayerPosition) {
  return Array.from({ length: CROSSING_SAMPLES + 1 }, (_, index) =>
    getQuadraticPoint(from, control, to, index / CROSSING_SAMPLES),
  );
}

function countBlockersHit(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  blockers: PlayerPosition[],
  blockerRadius: number,
) {
  const samples = 64;

  return blockers.filter((blocker) => {
    for (let index = 0; index <= samples; index += 1) {
      const point = getQuadraticPoint(from, control, to, index / samples);

      if (Math.hypot(point.x - blocker.x, point.y - blocker.y) < blockerRadius) {
        return true;
      }
    }

    return false;
  }).length;
}

/** Control point of the piece of a quadratic curve between `fromProgress` and `toProgress`. */
function getQuadraticBlossom(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  fromProgress: number,
  toProgress: number,
): PlayerPosition {
  const fromWeight = (1 - fromProgress) * (1 - toProgress);
  const controlWeight = (1 - fromProgress) * toProgress + fromProgress * (1 - toProgress);
  const toWeight = fromProgress * toProgress;

  return {
    x: fromWeight * from.x + controlWeight * control.x + toWeight * to.x,
    y: fromWeight * from.y + controlWeight * control.y + toWeight * to.y,
  };
}

function getQuadraticPoint(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  progress: number,
): PlayerPosition {
  const inverse = 1 - progress;

  return {
    x: inverse * inverse * from.x + 2 * inverse * progress * control.x + progress * progress * to.x,
    y: inverse * inverse * from.y + 2 * inverse * progress * control.y + progress * progress * to.y,
  };
}
