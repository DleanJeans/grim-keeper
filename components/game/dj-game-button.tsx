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
    height: 36,
    justifyContent: 'center',
    minWidth: 36,
  },
  pressed: {
    opacity: 0.65,
  },
});
