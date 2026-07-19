import { Maximize, Minimize } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supported = process.env.EXPO_OS === 'web' && document.fullscreenEnabled;

  useEffect(() => {
    if (!supported) {
      return;
    }

    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, [supported]);

  async function toggleFullscreen() {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  }

  if (!supported) {
    return null;
  }

  const Icon = isFullscreen ? Minimize : Maximize;

  return (
    <Pressable
      accessibilityLabel={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={toggleFullscreen}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon color={colors.text} size={21} strokeWidth={2.4} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
