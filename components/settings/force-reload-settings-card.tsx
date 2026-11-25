import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { forceReloadWebApp } from '@/utils/force-reload';

export function ForceReloadSettingsCard() {
  const [reloading, setReloading] = useState(false);

  if (process.env.EXPO_OS !== 'web') {
    return null;
  }

  async function reload() {
    setReloading(true);
    await forceReloadWebApp();
  }

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Force reload
        </Text>
        <Text selectable style={styles.description}>
          Clears the app's cached files and loads the newest version. Your games, friends, notes,
          settings, and theme are kept.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Force reload and clear cache"
        accessibilityRole="button"
        disabled={reloading}
        onPress={reload}
        style={({ pressed }) => [styles.button, (pressed || reloading) && styles.buttonPressed]}
      >
        <RefreshCw color={colors.text} size={18} strokeWidth={2.6} />
        <Text style={styles.buttonText}>{reloading ? 'Reloading…' : 'Reload'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
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
