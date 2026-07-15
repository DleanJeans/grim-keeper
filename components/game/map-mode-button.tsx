import { Check } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';

type MapModeButtonProps = {
  accessibilityLabel: string;
  flex?: number;
  icon?: ComponentType<{ color: string; size: number; strokeWidth?: number }>;
  iconColor?: string;
  label?: string;
  onPress: () => void;
  variant?: 'default' | 'confirm';
  width?: number;
};

export function MapModeButton({
  accessibilityLabel,
  flex = 1,
  icon: Icon,
  iconColor = '#f8fafc',
  label,
  onPress,
  variant = 'default',
  width,
}: MapModeButtonProps) {
  if (variant === 'confirm') {
    return (
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? '#dbeafe' : '#f8fafc',
          borderColor: '#f8fafc',
          borderRadius: 8,
          borderWidth: 1,
          justifyContent: 'center',
          minWidth: 48,
          paddingVertical: 14,
          width: width ?? 48,
        })}
      >
        <Check color="#0b1120" size={17} strokeWidth={2.8} />
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#1f2937' : '#111827',
        borderColor: '#334155',
        borderRadius: 8,
        borderWidth: 1,
        flex,
        flexBasis: 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        paddingVertical: 14,
      })}
    >
      {Icon ? <Icon color={iconColor} size={17} strokeWidth={2.7} /> : null}
      {label ? <Text style={{ color: '#f8fafc', fontWeight: '900' }}>{label}</Text> : null}
    </Pressable>
  );
}
