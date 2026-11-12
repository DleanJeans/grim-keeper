import {
  type KeyboardAvoidingViewProps,
  KeyboardAvoidingView as RNKeyboardAvoidingView,
  View,
} from 'react-native';

import { useUiScale } from '@/theme/ui-scale';

/**
 * React Native's KeyboardAvoidingView, except while the UI size in Settings is not 100%: then
 * `UiScaleView` already shrinks the screen for the keyboard, and the native one would measure
 * the keyboard in the wrong units, so this is a plain View.
 */
export function KeyboardAvoidingView(props: KeyboardAvoidingViewProps) {
  const scale = useUiScale();

  if (scale !== 1) {
    const { behavior, contentContainerStyle, enabled, keyboardVerticalOffset, ...viewProps } =
      props;
    return <View {...viewProps} />;
  }

  return <RNKeyboardAvoidingView {...props} />;
}
