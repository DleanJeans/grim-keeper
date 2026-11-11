import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const MAX_FONT_SIZE = 10;
/** Font sizes a name steps down through, largest first. */
const FONT_SIZES = [10, 9.5, 9, 8.5, 8, 7.5, 7] as const;
const MIN_FONT_SIZE = FONT_SIZES[FONT_SIZES.length - 1];
/** Font size of a name that still doesn't fit on one line and wraps at its spaces instead. */
const WRAPPED_FONT_SIZE = 9;

export type FitTokenTextProps = {
  children: string;
  /** Room for the text inside the token. */
  maxWidth: number;
};

/**
 * A name inside a round token: one line, its font stepping down until it fits. A name of several
 * words that still doesn't fit breaks between words, never inside one.
 */
export function FitTokenText({ children, maxWidth }: FitTokenTextProps) {
  const [widths, setWidths] = useState<{ text: string; whole: number; word: number }>();
  const longestWord = children
    .split(/\s+/)
    .reduce((longest, word) => (word.length > longest.length ? word : longest), '');
  const measured = widths?.text === children ? widths : undefined;

  const handleMeasure = (key: 'whole' | 'word') => (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidths((current) => ({
      whole: 0,
      word: 0,
      ...(current?.text === children ? current : undefined),
      text: children,
      [key]: width,
    }));
  };

  const fitSize = (width: number) =>
    width > 0 ? Math.min(MAX_FONT_SIZE, (MAX_FONT_SIZE * maxWidth) / width) : MAX_FONT_SIZE;
  const wholeSize = measured ? fitSize(measured.whole) : MAX_FONT_SIZE;
  const isWrapped = wholeSize < MIN_FONT_SIZE && children.includes(' ');
  const idealSize = isWrapped
    ? Math.min(WRAPPED_FONT_SIZE, fitSize(measured?.word ?? 0))
    : wholeSize;
  const fontSize = FONT_SIZES.find((size) => size <= idealSize) ?? MIN_FONT_SIZE;
  const isReady = measured !== undefined && measured.whole > 0 && measured.word > 0;

  return (
    <>
      <View pointerEvents="none" style={styles.measure}>
        <Text onLayout={handleMeasure('whole')} style={[styles.text, styles.measureText]}>
          {children}
        </Text>
        <Text onLayout={handleMeasure('word')} style={[styles.text, styles.measureText]}>
          {longestWord}
        </Text>
      </View>
      <Text
        ellipsizeMode="clip"
        numberOfLines={isWrapped ? 2 : 1}
        style={[styles.text, SIZE_STYLES[fontSize], !isReady && styles.hidden]}
      >
        {children}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  hidden: {
    opacity: 0,
  },
  // Lays the text out at full size off to the side, so its natural width can be read.
  measure: {
    alignItems: 'flex-start',
    left: 0,
    opacity: 0,
    position: 'absolute',
    top: 0,
    width: 1000,
  },
  measureText: {
    fontSize: MAX_FONT_SIZE,
  },
  text: {
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
});

const SIZE_STYLES = StyleSheet.create({
  10: { fontSize: 10, lineHeight: 12 },
  9.5: { fontSize: 9.5, lineHeight: 11.5 },
  9: { fontSize: 9, lineHeight: 11 },
  8.5: { fontSize: 8.5, lineHeight: 10.5 },
  8: { fontSize: 8, lineHeight: 10 },
  7.5: { fontSize: 7.5, lineHeight: 9.5 },
  7: { fontSize: 7, lineHeight: 9 },
});
