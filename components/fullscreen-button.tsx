import { Maximize, Minimize } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { useWebFullscreen } from '@/hooks/use-web-fullscreen';
import { colors } from '@/theme/colors';
import { canUseWebFullscreen, requestWebFullscreen } from '@/utils/web-fullscreen';

export function FullscreenButton() {
  const isFullscreen = useWebFullscreen();
  const supported = canUseWebFullscreen();

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
