import type { ComponentType } from 'react';
import { Pressable } from 'react-native';
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
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed && !disabled ? '#1f2937' : '#111827',
        borderColor: disabled ? '#1f2937' : '#334155',
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexBasis: 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        opacity: disabled ? 0.5 : 1,
        paddingVertical: 14,
      })}
    >
      {direction === 'prev' ? <Icon color="#f8fafc" size={17} strokeWidth={2.7} /> : null}
      <Text style={{ color: '#f8fafc', fontWeight: '900' }}>{label}</Text>
      {direction === 'next' ? <Icon color="#f8fafc" size={17} strokeWidth={2.7} /> : null}
    </Pressable>
  );
}
