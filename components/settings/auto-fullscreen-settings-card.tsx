import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { isAutoFullscreenEnabled, setAutoFullscreenEnabled } from '@/utils/web-fullscreen';

export function AutoFullscreenSettingsCard() {
  const [enabled, setEnabled] = useState(isAutoFullscreenEnabled);

  if (process.env.EXPO_OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Auto full screen
        </Text>
        <Text selectable style={styles.description}>
          Enter full screen when opening or starting a game.
        </Text>
      </View>
      <Switch
        accessibilityLabel="Auto full screen"
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onValueChange={(value) => {
          setEnabled(value);
          setAutoFullscreenEnabled(value);
        }}
        trackColor={{ false: colors.disabled, true: colors.borderStrong }}
        value={enabled}
        thumbColor={enabled ? colors.primary : colors.onDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    padding: 16,
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
