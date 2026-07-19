import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, type StyleProp, type TextStyle, View, type ViewStyle } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RoleReferenceProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  contentStyle?: StyleProp<ViewStyle>;
  iconSize?: number;
  iconScale?: number;
  leading?: ReactNode;
  onPress?: () => void;
  role: Role;
  scriptId?: string;
  textStyle?: StyleProp<TextStyle>;
};

export function RoleReference({
  accessibilityLabel,
  children,
  containerStyle,
  contentStyle,
  iconSize = 24,
  iconScale = 1.35,
  leading,
  onPress,
  role,
  scriptId,
  textStyle,
}: RoleReferenceProps) {
  return (
    <Pressable
      accessibilityHint="Long press to open notes for this role"
      accessibilityLabel={accessibilityLabel ?? role.name}
      accessibilityRole="button"
      delayLongPress={350}
      onLongPress={() =>
        router.push({
          pathname: '/role-notes',
          params: scriptId ? { roleId: role.id, scriptId } : { roleId: role.id },
        })
      }
      onPress={onPress}
      style={({ pressed }) => [
        { alignItems: 'center', flexDirection: 'row', opacity: pressed ? 0.65 : 1, gap: 2 },
        typeof containerStyle === 'function' ? containerStyle({ pressed }) : containerStyle,
      ]}
    >
      {leading}
      <RoleIcon role={role} size={iconSize} scale={iconScale} />
      <View style={[{ flexShrink: 1, gap: 1 }, contentStyle]}>
        <Text
          selectable
          style={[{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }, textStyle]}
        >
          {role.name}
        </Text>
        {children}
      </View>
    </Pressable>
  );
}
