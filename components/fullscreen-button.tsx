import { Maximize, Minimize } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/theme/colors';
import { canUseWebFullscreen, requestWebFullscreen } from '@/utils/web-fullscreen';

export function FullscreenButton() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const supported = canUseWebFullscreen();

  useEffect(() => {
    if (!supported) {
      return;
    }

    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, [supported]);

  async function toggleFullscreen() {
    if (!supported) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await requestWebFullscreen();
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
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  pressed: {
    opacity: 0.65,
  },
});
