import { KeyboardAvoidingView as RNKeyboardAvoidingView } from 'react-native';

import { getUiScale } from '@/theme/display-scale';

/** The keyboard frame React Native reports; only `screenY` matters here. */
type KeyboardMetrics = { screenY: number };

type KeyboardHeightMethod = (keyboardFrame: KeyboardMetrics) => Promise<number>;

/**
 * React Native's KeyboardAvoidingView, for content inside a `UiScaleView`. It measures itself in
 * scaled units but gets the keyboard position in screen units, so the keyboard top is converted
 * to scaled units first. Without that the keyboard covers dialogs when the UI is scaled up.
 */
export class KeyboardAvoidingView extends RNKeyboardAvoidingView {
  _relativeKeyboardHeight(keyboardFrame: KeyboardMetrics) {
    const relativeKeyboardHeight = (
      RNKeyboardAvoidingView.prototype as unknown as {
        _relativeKeyboardHeight?: KeyboardHeightMethod;
      }
    )._relativeKeyboardHeight;
    if (!relativeKeyboardHeight) return Promise.resolve(0);

    const scale = getUiScale();
    return relativeKeyboardHeight.call(
      this,
      scale === 1 ? keyboardFrame : { ...keyboardFrame, screenY: keyboardFrame.screenY / scale },
    );
  }
}
