import { RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { forceReloadWebApp, isWebUpdateAvailable } from '@/utils/force-reload';

type Status = 'idle' | 'checking' | 'current' | 'available' | 'unknown' | 'reloading';

const STATUS_TEXT: Record<Status, string> = {
  available: 'A new version is available.',
  checking: 'Checking…',
  current: "You're on the latest version.",
  idle: 'See if a newer version has been deployed.',
  reloading: 'Reloading…',
  unknown: "Couldn't check for updates.",
};

const BUTTON_TEXT: Record<Status, string> = {
  available: 'Update now',
  checking: 'Checking…',
  current: 'Check again',
  idle: 'Check',
  reloading: 'Reloading…',
  unknown: 'Force reload',
};

export function ForceReloadSettingsCard() {
  const [status, setStatus] = useState<Status>('idle');

  if (process.env.EXPO_OS !== 'web') {
    return null;
  }

  const busy = status === 'checking' || status === 'reloading';

  async function press() {
    if (status === 'available' || status === 'unknown') {
      setStatus('reloading');
      await forceReloadWebApp();
      return;
    }
    setStatus('checking');
    const available = await isWebUpdateAvailable();
    setStatus(available === undefined ? 'unknown' : available ? 'available' : 'current');
  }

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Check for updates
        </Text>
        <Text selectable style={styles.description}>
          {STATUS_TEXT[status]} Reloading clears cached app files only; your games, friends, notes,
          settings, and theme are kept.
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Check for updates or force reload"
        accessibilityRole="button"
        disabled={busy}
        onPress={press}
        style={({ pressed }) => [styles.button, (pressed || busy) && styles.buttonPressed]}
      >
        <RefreshCw color={colors.text} size={18} strokeWidth={2.6} />
        <Text style={styles.buttonText}>{BUTTON_TEXT[status]}</Text>
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
