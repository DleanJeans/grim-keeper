import type { ComponentType } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/text';

type DayStepperButtonProps = {
  accessibilityLabel: string;
  direction: 'next' | 'prev';
  disabled: boolean;
  icon: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  label: string;
  onPress: () => void;
};

export function DayStepperButton({
  accessibilityLabel,
  direction,
  disabled,
  icon: Icon,
  label,
  onPress,
}: DayStepperButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {direction === 'prev' ? <Icon color="#f8fafc" size={17} strokeWidth={2.7} /> : null}
      <Text style={styles.label}>{label}</Text>
      {direction === 'next' ? <Icon color="#f8fafc" size={17} strokeWidth={2.7} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: 14,
  },
  disabled: {
    borderColor: '#1f2937',
    opacity: 0.5,
  },
  label: {
    color: '#f8fafc',
    fontWeight: '900',
  },
  pressed: {
    backgroundColor: '#1f2937',
  },
});
