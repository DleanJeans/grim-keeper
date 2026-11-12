import { StyleSheet } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
  TextPath,
} from 'react-native-svg';

import { colors } from '@/theme/colors';

// Proportions of the token's radius, from the design mockup (radius 32).
const RING_SPACE = 3.5 / 32;
const INNER_RING_INSET = 4 / 32;
const RIBBON_RADIUS = 0.74;
const RIBBON_WIDTH = 11 / 32;
const RIBBON_HALF_ANGLE_DEGREES = 58;
const TOP_TEXT_RADIUS = 0.78;
const NAME_FONT = 9 / 32;
const MIN_NAME_FONT = 5.5 / 32;
const TOP_FONT = 8.5 / 32;
const MIN_TOP_FONT = 5 / 32;
const INITIAL_FONT = 24 / 32;
const SMALL_INITIAL_FONT = 14 / 32;
// Width of one small-caps glyph as a share of the font size, for fitting text on the arcs.
const GLYPH_WIDTH = 0.62;
const NAME_ARC_ROOM = 1.7;
const TOP_ARC_ROOM = 1.5;
const SHROUD_HALF_WIDTH = 0.42;
const FONT_FAMILY = 'IMFellEnglishSC';
const tokenColors = colors.grimoireToken;

type GrimoireTokenFaceProps = {
  dead: boolean;
  /** Draw the first letter of the name in the middle (no character icon is shown). Hidden under the shroud. */
  showInitial: boolean;
  /** The initial sits low and small to leave the top to claim tokens. */
  compactInitial: boolean;
  /** Unique per token on the map; used for the SVG ids. */
  id: string;
  /**
   * The face is drawn in two layers so the character icon can sit between them: the base disc,
   * ribbon and name, then the drape (the shroud and the character's name) on top.
   */
  layer: 'base' | 'drape';
  name: string;
  ring?: 'drag' | 'initiator' | 'selected';
  size: number;
  storyteller: boolean;
  /** Text curved along the top edge, such as the character names. */
  topText?: string;
};

/**
 * The drawn face of a map token, styled like a grimoire token: a parchment disc, the player's
 * name on a ribbon along the bottom and the character's name along the top. Dead players turn
 * ashen under a black shroud.
 */
export function GrimoireTokenFace({
  compactInitial,
  dead,
  id,
  layer,
  name,
  ring,
  showInitial,
  size,
  storyteller,
  topText,
}: GrimoireTokenFaceProps) {
  const center = size / 2;
  const radius = size / 2 - size * RING_SPACE * 0.5;
  const ribbonRadius = radius * RIBBON_RADIUS;
  const topRadius = radius * TOP_TEXT_RADIUS;
  const ribbonSpread = (RIBBON_HALF_ANGLE_DEGREES * Math.PI) / 180;
  const ribbonX = ribbonRadius * Math.sin(ribbonSpread);
  const ribbonY = ribbonRadius * Math.cos(ribbonSpread);
  const nameFont = fitFont(name, radius, NAME_FONT, MIN_NAME_FONT, NAME_ARC_ROOM);
  const topFont = topText ? fitFont(topText, radius, TOP_FONT, MIN_TOP_FONT, TOP_ARC_ROOM) : 0;
  const ink = dead ? tokenColors.deadInk : tokenColors.ink;
  const safeId = `${layer}-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const ids = {
    ash: `gt-ash-${safeId}`,
    bottom: `gt-bottom-${safeId}`,
    clip: `gt-clip-${safeId}`,
    parchment: `gt-parch-${safeId}`,
    top: `gt-top-${safeId}`,
  };
  const ringColor =
    ring === 'drag'
      ? tokenColors.dragRing
      : ring === 'initiator'
        ? tokenColors.initiatorRing
        : ring === 'selected'
          ? tokenColors.selectedRing
          : undefined;

  return (
    <Svg height={size} style={styles.svg} width={size}>
      <Defs>
        <RadialGradient cx="45%" cy="40%" id={ids.parchment} r="65%">
          <Stop offset="0" stopColor={tokenColors.parchmentCenter} />
          <Stop offset="0.7" stopColor={tokenColors.parchmentMiddle} />
          <Stop offset="1" stopColor={tokenColors.parchmentEdge} />
        </RadialGradient>
        <RadialGradient cx="45%" cy="40%" id={ids.ash} r="65%">
          <Stop offset="0" stopColor={tokenColors.ashCenter} />
          <Stop offset="1" stopColor={tokenColors.ashEdge} />
        </RadialGradient>
        <ClipPath id={ids.clip}>
          <Circle cx={center} cy={center} r={radius} />
        </ClipPath>
        {/*
          Left to right along the bottom, and along the top; text sits upright on both. The
          curved text is centered by textAnchor on the outer Text too, because Android ignores it
          on the TextPath and starts the text at the middle of the arc instead.
        */}
        <Path
          d={`M ${center - ribbonRadius} ${center} A ${ribbonRadius} ${ribbonRadius} 0 0 0 ${center + ribbonRadius} ${center}`}
          id={ids.bottom}
        />
        <Path
          d={`M ${center - topRadius} ${center} A ${topRadius} ${topRadius} 0 0 1 ${center + topRadius} ${center}`}
          id={ids.top}
        />
      </Defs>
      {layer === 'base' ? (
        <>
          {ringColor ? (
            <Circle
              cx={center}
              cy={center}
              fill="none"
              r={size / 2 - (size * RING_SPACE) / 4}
              stroke={ringColor}
              strokeWidth={(size * RING_SPACE) / 2}
            />
          ) : null}
          <Circle
            cx={center}
            cy={center}
            fill={`url(#${dead ? ids.ash : ids.parchment})`}
            r={radius}
            stroke={tokenColors.edge}
            strokeWidth={Math.max(1.5, size / 45)}
          />
          <Circle
            cx={center}
            cy={center}
            fill="none"
            r={radius - radius * INNER_RING_INSET}
            stroke={dead ? tokenColors.deadInnerRing : tokenColors.innerRing}
            strokeWidth={0.8}
          />
          {showInitial && !dead ? (
            <SvgText
              fill={ink}
              fontFamily={FONT_FAMILY}
              fontSize={radius * (compactInitial ? SMALL_INITIAL_FONT : INITIAL_FONT)}
              opacity={0.85}
              textAnchor="middle"
              x={center}
              y={center + radius * (compactInitial ? 0.38 : storyteller ? 0.02 : 0.06)}
            >
              {storyteller && !compactInitial ? '✦' : getInitial(name)}
            </SvgText>
          ) : null}
          <Path
            d={`M ${center - ribbonX} ${center + ribbonY} A ${ribbonRadius} ${ribbonRadius} 0 0 0 ${center + ribbonX} ${center + ribbonY}`}
            fill="none"
            stroke={
              dead
                ? tokenColors.deadRibbon
                : storyteller
                  ? tokenColors.storytellerRibbon
                  : tokenColors.ribbon
            }
            strokeLinecap="round"
            strokeWidth={radius * RIBBON_WIDTH}
          />
          <SvgText
            dy={nameFont * 0.34}
            fill={dead ? tokenColors.deadRibbonText : tokenColors.ribbonText}
            fontFamily={FONT_FAMILY}
            fontSize={nameFont}
            letterSpacing={nameFont * 0.06}
            textAnchor="middle"
          >
            <TextPath href={`#${ids.bottom}`} startOffset="50%" textAnchor="middle">
              {name}
            </TextPath>
          </SvgText>
        </>
      ) : (
        <>
          {dead ? (
            <G clipPath={`url(#${ids.clip})`}>
              <Path
                d={`M ${center - radius * SHROUD_HALF_WIDTH} ${center - radius} H ${center + radius * SHROUD_HALF_WIDTH} V ${center - radius * 0.05} L ${center} ${center - radius * 0.3} L ${center - radius * SHROUD_HALF_WIDTH} ${center - radius * 0.05} Z`}
                fill={tokenColors.shroud}
                opacity={0.92}
              />
            </G>
          ) : null}
          {topText ? (
            <SvgText
              dy={topFont * 0.8}
              fill={dead ? tokenColors.deadTopText : tokenColors.topText}
              fontFamily={FONT_FAMILY}
              fontSize={topFont}
              letterSpacing={topFont * 0.1}
              textAnchor="middle"
            >
              <TextPath href={`#${ids.top}`} startOffset="50%" textAnchor="middle">
                {topText}
              </TextPath>
            </SvgText>
          ) : null}
        </>
      )}
    </Svg>
  );
}

/** Font size for `text` on an arc with room for `room` radii of text, between min and max. */
function fitFont(text: string, radius: number, max: number, min: number, room: number) {
  const fitted = (room * radius) / (Math.max(1, text.length) * GLYPH_WIDTH);
  return Math.max(min * radius, Math.min(max * radius, fitted));
}

function getInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '';
}

const styles = StyleSheet.create({
  svg: { left: 0, pointerEvents: 'none', position: 'absolute', top: 0 },
});
