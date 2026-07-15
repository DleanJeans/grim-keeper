import { Eye } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function RevealRolesButton({
  onRevealRolesChange,
  showRoles,
}: {
  onRevealRolesChange: (show: boolean) => void;
  showRoles: boolean;
}) {
  const color = showRoles ? colors.primary : colors.textMuted;
  return (
    <Pressable
      accessibilityHint="Hold to reveal every player role"
      accessibilityLabel="Hold to reveal all roles"
      accessibilityRole="button"
      onPressIn={() => onRevealRolesChange(true)}
      onPressOut={() => onRevealRolesChange(false)}
      onTouchCancel={() => onRevealRolesChange(false)}
      hitSlop={10}
      pressRetentionOffset={10}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed || showRoles ? colors.surfacePressed : colors.surface,
        borderColor: showRoles ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 6,
      })}
    >
      <Eye color={color} size={17} strokeWidth={2.6} />
      <Text style={{ color, fontSize: 10 }}>Roles</Text>
    </Pressable>
  );
}
