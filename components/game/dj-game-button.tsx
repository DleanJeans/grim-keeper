import { router } from 'expo-router';
import { Music2 } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

type DjGameButtonProps = {
  gameId: string;
};

export function DjGameButton({ gameId }: DjGameButtonProps) {
  return (
    <Pressable
      accessibilityLabel="Open DJ mode"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => router.push({ pathname: '/dj/[id]', params: { id: gameId } })}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Music2 color={colors.text} size={20} strokeWidth={2.5} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
