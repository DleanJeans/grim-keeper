import { Eye } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function ShowRolesButton() {
  const { setShowRoles, showRoles } = useGameRouteContext();

  return (
    <Pressable
      accessibilityHint="Hold to reveal every player role"
      accessibilityLabel="Hold to show all roles"
      accessibilityRole="button"
      onPressIn={() => setShowRoles(true)}
      onPressOut={() => setShowRoles(false)}
      onTouchCancel={() => setShowRoles(false)}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed || showRoles ? colors.surfacePressed : colors.surface,
        borderColor: showRoles ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        minWidth: 0,
        paddingVertical: 14,
      })}
    >
      <Eye color={showRoles ? colors.primary : colors.textMuted} size={17} strokeWidth={2.6} />
      <Text style={{ color: showRoles ? colors.primary : colors.text, fontWeight: '900' }}>
        Show roles
      </Text>
    </Pressable>
  );
}
