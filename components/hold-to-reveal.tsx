import type { ReactNode } from 'react';
import {
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

type HoldToRevealProps = {
  accessibilityLabel?: string;
  children: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
  /** Called with true while the finger is down and false when it lifts. */
  onHoldChange: (holding: boolean) => void;
  style?: ViewStyle | ((state: PressableStateCallbackType) => ViewStyle | (ViewStyle | false)[]);
};

/**
 * A button that is "on" only while it is held. A phone's long-press would normally open the
 * context menu or start a text selection and cancel the press, hiding the content while the
 * finger is still down, so both are suppressed and drifting off the button does not release it.
 */
export function HoldToReveal({
  accessibilityLabel,
  children,
  onHoldChange,
  style,
}: HoldToRevealProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      delayLongPress={100000}
      {...WEB_PROPS}
      onPressIn={() => onHoldChange(true)}
      onPressOut={() => onHoldChange(false)}
      pressRetentionOffset={RETENTION}
      style={(state) => [styles.noSelect, typeof style === 'function' ? style(state) : style]}
    >
      {children}
    </Pressable>
  );
}

/** react-native-web passes this through; native ignores it. */
const WEB_PROPS = {
  onContextMenu: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
} as object;

const RETENTION = { bottom: 2000, left: 2000, right: 2000, top: 2000 };

const styles = StyleSheet.create({
  noSelect: {
    userSelect: 'none',
    WebkitTouchCallout: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
  } as ViewStyle,
});
