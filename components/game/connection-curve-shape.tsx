import { G, Path, Polygon } from 'react-native-svg';

// Stroke width around the arrowhead that rounds its corners.
export const ARROW_ROUNDING = 3;

/** Draws a curve worked out by `getConnectionCurve`. */
export function ConnectionCurveShape({
  curve,
  opacity,
  stroke,
  strokeWidth,
}: {
  curve: { arrowPoints: string[]; path: string | null };
  opacity: number;
  stroke: string;
  strokeWidth: number;
}) {
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
