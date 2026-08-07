import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type RoleAssignmentButtonProps = {
  accessibilityLabel?: string;
  compact?: boolean;
  icon?: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function RoleAssignmentButton({
  accessibilityLabel,
  compact = false,
  icon: Icon,
  label,
  onPress,
  selected,
}: RoleAssignmentButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact ? styles.compact : styles.expanded,
        pressed ? styles.pressed : selected ? styles.selected : styles.idle,
      ]}
    >
      {Icon ? (
        <Icon color={selected ? colors.onPrimary : colors.textMuted} size={16} strokeWidth={2.5} />
      ) : null}
      <Text
        style={[styles.label, compact && styles.compactLabel, selected && styles.selectedLabel]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
  },
  compact: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  compactLabel: {
    fontSize: 12,
  },
  expanded: {
    flex: 1,
    paddingVertical: 12,
  },
  idle: {
    backgroundColor: colors.surfaceRaised,
  },
  label: {
    color: colors.text,
    fontWeight: '900',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectedLabel: {
    color: colors.onPrimary,
  },
});
