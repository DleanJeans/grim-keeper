import { type ReactNode, useState } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const TOOLTIP_MAX_WIDTH = 240;

type HoverTooltipProps = {
  children: ReactNode;
  label: string;
  style?: StyleProp<ViewStyle>;
};

/** Shows `label` in a small bubble above `children` while a pointer hovers it. */
export function HoverTooltip({ children, label, style }: HoverTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    // A plain View with pointer events, so taps and holds still reach the card underneath.
    <View
      accessibilityLabel={label}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      style={[style, isHovered && styles.hovered]}
    >
      {children}
      {isHovered ? (
        <View style={styles.anchor}>
          <View style={styles.bubble}>
            <Text style={styles.label}>{label}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    alignItems: 'flex-start',
    bottom: '100%',
    left: 0,
    marginBottom: 6,
    pointerEvents: 'none',
    position: 'absolute',
    width: TOOLTIP_MAX_WIDTH,
  },
  bubble: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  hovered: {
    zIndex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
});
