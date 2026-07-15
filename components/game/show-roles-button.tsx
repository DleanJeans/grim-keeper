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
  return (
    <Pressable
      accessibilityHint="Hold to reveal every player role"
      accessibilityLabel="Hold to reveal all roles"
      accessibilityRole="button"
      onPressIn={() => onRevealRolesChange(true)}
      onPressOut={() => onRevealRolesChange(false)}
      onTouchCancel={() => onRevealRolesChange(false)}
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
        paddingVertical: 8,
      })}
    >
      <Eye color={showRoles ? colors.primary : colors.textMuted} size={17} strokeWidth={2.6} />
      <Text style={{ color: showRoles ? colors.primary : colors.text, fontWeight: '900' }}>
        Reveal roles
      </Text>
    </Pressable>
  );
}
