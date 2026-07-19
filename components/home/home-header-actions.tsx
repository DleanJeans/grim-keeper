import { router } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { FullscreenButton } from '@/components/fullscreen-button';
import { colors } from '@/theme/colors';

export function HomeHeaderActions() {
  return (
    <View style={styles.actions}>
      <FullscreenButton />
      <Pressable
        accessibilityLabel="Open settings"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push('/settings')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Settings color={colors.text} size={22} strokeWidth={2.4} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  button: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  pressed: {
    opacity: 0.65,
  },
});
