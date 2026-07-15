import { Eye } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { colors } from '@/theme/colors';

export function RevealRolesButton({
  onRevealRolesChange,
  showRoles,
}: {
  onRevealRolesChange: (show: boolean) => void;
  showRoles: boolean;
}) {
  return (
    <Pressable
      accessibilityHint="Hold to reveal every player role"
      accessibilityLabel="Hold to reveal all roles"
      accessibilityRole="button"
      onPress={() => onRevealRolesChange(false)}
      onPressIn={() => onRevealRolesChange(true)}
      onPressOut={() => onRevealRolesChange(false)}
      onTouchCancel={() => onRevealRolesChange(false)}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed || showRoles ? colors.surfacePressed : colors.surface,
        borderColor: showRoles ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        justifyContent: 'center',
        height: 32,
        width: 32,
      })}
    >
      <Eye color={showRoles ? colors.primary : colors.textMuted} size={17} strokeWidth={2.6} />
    </Pressable>
  );
}
