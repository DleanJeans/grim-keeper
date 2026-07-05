import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

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

function defaultFont(flatStyle: TextStyle | undefined) {
  return {
    fontFamily: getFontFamily(flatStyle),
    fontSize: flatStyle?.fontSize ?? defaultFontSize,
    fontWeight: undefined,
    includeFontPadding: false,
  };
}

export function Text(props: TextProps) {
  const flatStyle = StyleSheet.flatten(props.style) as TextStyle | undefined;

  return <RNText {...props} style={[props.style, defaultFont(flatStyle)]} />;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  function TextInput(props, ref) {
    const flatStyle = StyleSheet.flatten(props.style) as TextStyle | undefined;

    return <RNTextInput {...props} ref={ref} style={[props.style, defaultFont(flatStyle)]} />;
  },
);
