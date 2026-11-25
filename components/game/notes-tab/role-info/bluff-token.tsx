import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

const ICON_SIZES = { large: 120, medium: 48, small: 30 };

type BluffTokenProps = {
  accessibilityLabel?: string;
  onPress?: () => void;
  role: Role;
  selected?: boolean;
  size: 'small' | 'medium' | 'large';
};

/** A round role icon used on the bluff screens; the selected one gets a bright ring. */
export function BluffToken({ accessibilityLabel, onPress, role, selected, size }: BluffTokenProps) {
  const circle = (
    <View style={[styles.circle, styles[size], selected && styles.selected]}>
      <RoleIcon role={role} scale={1} size={ICON_SIZES[size]} />
    </View>
  );
  if (!onPress) return circle;
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress}>
      {circle}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderWidth: 2,
    justifyContent: 'center',
  },
  small: { borderRadius: 19, height: 38, width: 38 },
  medium: { borderRadius: 30, height: 60, width: 60 },
  large: { borderRadius: 75, height: 150, width: 150 },
  selected: { borderColor: colors.primary },
});
