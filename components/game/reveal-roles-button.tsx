import { Eye, EyeOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

const LONG_PRESS_MS = 500;

export function RevealRolesButton({
  onRevealRolesChange,
  showRoles,
  variant = 'full',
}: {
  onRevealRolesChange: (show: boolean) => void;
  showRoles: boolean;
  variant?: 'full' | 'icon';
}) {
  const color = showRoles ? colors.primary : colors.textMuted;
  const EyeIcon = showRoles ? EyeOff : Eye;
  const isIcon = variant === 'icon';
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!isIcon || Platform.OS !== 'android') return;

    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [isIcon]);

  // Track press start to distinguish a short tap (toggle) from a long press
  // (show while held, hide on release).
  const pressStartRef = useRef<number | null>(null);
  const longPressFiredRef = useRef(false);

  const handlePressIn = () => {
    pressStartRef.current = Date.now();
    longPressFiredRef.current = false;
  };

  const handlePressOut = () => {
    const startedAt = pressStartRef.current;
    pressStartRef.current = null;
    if (startedAt == null) return;

    const duration = Date.now() - startedAt;
    if (duration >= LONG_PRESS_MS) {
      // Held long enough: just turn off on release. Don't toggle.
      onRevealRolesChange(false);
    } else {
      // Short tap: toggle the persistent state.
      onRevealRolesChange(!showRoles);
    }
  };

  const handleTouchCancel = () => {
    pressStartRef.current = null;
    if (longPressFiredRef.current) {
      onRevealRolesChange(false);
    }
  };

  if (!isIcon) {
    return (
      <Pressable
        accessibilityHint="Tap to toggle. Hold to peek and release to hide."
        accessibilityLabel="Reveal all roles"
        accessibilityRole="button"
        delayLongPress={LONG_PRESS_MS}
        hitSlop={10}
        onLongPress={() => {
          longPressFiredRef.current = true;
          onRevealRolesChange(true);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onTouchCancel={handleTouchCancel}
        pressRetentionOffset={10}
        style={({ pressed }) => [
          styles.base,
          styles.full,
          pressed || showRoles ? styles.active : styles.idle,
          { borderColor: showRoles ? colors.primary : colors.borderStrong },
        ]}
      >
        <EyeIcon color={color} size={17} strokeWidth={2.6} />
        <Text style={[styles.label, { color }]}>Roles</Text>
      </Pressable>
    );
  }

  // Icon variant: render the "Reveal roles" label above the button, fading
  // in while pressed.
  return (
    <Pressable
      accessibilityHint="Tap to toggle. Hold to peek and release to hide."
      accessibilityLabel="Reveal all roles"
      accessibilityRole="button"
      delayLongPress={LONG_PRESS_MS}
      hitSlop={8}
      onLongPress={() => {
        longPressFiredRef.current = true;
        onRevealRolesChange(true);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onTouchCancel={handleTouchCancel}
      pressRetentionOffset={10}
      style={[styles.iconWrapper, { transform: [{ translateY: keyboardHeight }] }]}
    >
      {({ pressed }) => (
        <>
          <Text
            style={[styles.iconLabel, pressed ? styles.iconLabelShown : styles.iconLabelHidden]}
          >
            Reveal roles
          </Text>
          <View
            style={[
              styles.icon,
              pressed || showRoles ? styles.active : styles.idle,
              { borderColor: showRoles ? colors.primary : colors.borderStrong },
            ]}
          >
            <EyeIcon color={color} size={28} strokeWidth={2.6} />
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.surfacePressed,
  },
  base: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  full: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  iconLabel: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    pointerEvents: 'none',
    textAlign: 'center',
  },
  iconLabelHidden: {
    opacity: 0,
  },
  iconLabelShown: {
    opacity: 1,
  },
  iconWrapper: {
    alignItems: 'center',
  },
  idle: {
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 10,
  },
});
