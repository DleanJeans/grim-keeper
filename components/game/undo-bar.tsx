import { Undo2 } from 'lucide-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

/** How long the bar stays up after a change. */
const UNDO_VISIBLE_MS = 6000;

/** Give it a new `key` for each edit so the timer restarts. */
type UndoBarProps = {
  label: string;
  onDismiss: () => void;
  onUndo: () => void;
};

/** Floating "Claim saved · Undo" bar shown for a few seconds after an undoable edit. */
export function UndoBar({ label, onDismiss, onUndo }: UndoBarProps) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const timeout = setTimeout(() => dismissRef.current(), UNDO_VISIBLE_MS);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View accessibilityLiveRegion="polite" style={styles.bar}>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Pressable
        accessibilityLabel={`Undo: ${label}`}
        accessibilityRole="button"
        hitSlop={8}
        onPress={onUndo}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Undo2 color={colors.gameText} size={16} strokeWidth={2.6} />
        <Text style={styles.buttonText}>Undo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 10,
    borderWidth: 1,
    bottom: 32,
    flexDirection: 'row',
    gap: 8,
    left: 16,
    minHeight: 48,
    paddingLeft: 14,
    paddingRight: 6,
    position: 'absolute',
    right: 92,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    minHeight: 40,
    paddingHorizontal: 10,
  },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  buttonText: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  label: { color: colors.gameTextSoft, flex: 1, fontSize: 14, fontWeight: '700' },
});
