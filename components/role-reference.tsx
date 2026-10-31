import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';
import {
  NOTE_REFERENCE_ICON_SCALE,
  NOTE_REFERENCE_ICON_SIZE,
  noteReferenceStyles,
} from '@/components/note-reference-styles';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type RoleReferenceProps = {
  accessibilityLabel?: string;
  children?: ReactNode;
  containerStyle?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  contentStyle?: StyleProp<ViewStyle>;
  // Renders as a non-interactive View. Use when nested inside another pressable to avoid
  // `<button>` inside `<button>` hydration errors on web.
  disablePress?: boolean;
  iconSize?: number;
  iconScale?: number;
  leading?: ReactNode;
  onPress?: () => void;
  role: Role;
  scriptId?: string;
  textStyle?: StyleProp<TextStyle>;
  variant?: 'default' | 'note';
};

export function RoleReference({
  accessibilityLabel,
  children,
  containerStyle,
  contentStyle,
  disablePress = false,
  iconSize,
  iconScale,
  leading,
  onPress,
  role,
  scriptId,
  textStyle,
  variant = 'default',
}: RoleReferenceProps) {
  const resolvedIconSize = iconSize ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SIZE : 24);
  const resolvedIconScale = iconScale ?? (variant === 'note' ? NOTE_REFERENCE_ICON_SCALE : 1.35);

  const resolvedContainerStyle: StyleProp<ViewStyle> =
    typeof containerStyle === 'function' ? containerStyle({ pressed: false }) : containerStyle;

  const body = (
    <>
      {leading}
      <RoleIcon role={role} scale={resolvedIconScale} size={resolvedIconSize} />
      <View style={[styles.content, contentStyle]}>
        <Text
          selectable
          style={[styles.name, textStyle, variant === 'note' && noteReferenceStyles.text]}
        >
          {role.name}
        </Text>
        {children}
      </View>
    </>
  );

  if (disablePress) {
    return (
      <View
        accessibilityLabel={accessibilityLabel ?? role.name}
        style={[
          styles.row,
          variant === 'note' && noteReferenceStyles.container,
          resolvedContainerStyle,
        ]}
      >
        {body}
      </View>
    );
  }

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
        styles.row,
        pressed && styles.rowPressed,
        variant === 'note' && noteReferenceStyles.container,
        typeof containerStyle === 'function' ? containerStyle({ pressed }) : containerStyle,
      ]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flexShrink: 1,
    gap: 1,
  },
  name: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  rowPressed: {
    opacity: 0.65,
  },
});
