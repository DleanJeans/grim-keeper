import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

import { useFontScale } from '@/theme/display-scale';

const defaultFontSize = 14;
const boldWeights = ['600', '700', '800', '900', 'bold'];

function getFontFamily(flatStyle: TextStyle | undefined) {
  if (flatStyle?.fontFamily) {
    return flatStyle.fontFamily;
  }

  const weight = String(flatStyle?.fontWeight ?? '');

  if (boldWeights.includes(weight)) {
    return 'GoogleSans-Bold';
  }

  return 'GoogleSans';
}

function defaultFont(flatStyle: TextStyle | undefined, scale: number) {
  const lineHeight = flatStyle?.lineHeight;

  return {
    fontFamily: getFontFamily(flatStyle),
    fontSize: (flatStyle?.fontSize ?? defaultFontSize) * scale,
    fontWeight: undefined,
    includeFontPadding: false,
    ...(lineHeight === undefined ? null : { lineHeight: lineHeight * scale }),
  };
}

export function Text(props: TextProps) {
  const flatStyle = StyleSheet.flatten(props.style) as TextStyle | undefined;
  const scale = useFontScale();

  return <RNText {...props} style={[props.style, defaultFont(flatStyle, scale)]} />;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function TextInput(props, ref) {
    const flatStyle = StyleSheet.flatten(props.style) as TextStyle | undefined;
    const scale = useFontScale();

    return (
      <RNTextInput {...props} ref={ref} style={[props.style, defaultFont(flatStyle, scale)]} />
    );
  },
);
