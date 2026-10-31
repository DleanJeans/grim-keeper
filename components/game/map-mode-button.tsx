import { Check } from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

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
  iconColor = colors.gameText,
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
          backgroundColor: pressed ? colors.gameTextPressed : colors.gameText,
          borderColor: colors.gameText,
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
        backgroundColor: pressed ? colors.gameSurfacePressed : colors.gameSurface,
        borderColor: colors.gameBorder,
        borderRadius: 8,
        borderWidth: 1,
        flex: width === undefined ? flex : undefined,
        flexBasis: width !== undefined ? undefined : 0,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        paddingVertical: 14,
        width,
      })}
    >
      {Icon ? <Icon color={iconColor} size={17} strokeWidth={2.7} /> : null}
      {label ? <Text style={{ color: colors.gameText, fontWeight: '900' }}>{label}</Text> : null}
    </Pressable>
  );
}
