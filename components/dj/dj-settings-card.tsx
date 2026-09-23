import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { useDjStore } from '@/store/dj-store';
import { colors } from '@/theme/colors';

export function DjSettingsCard() {
  const enabled = useDjStore((state) => state.enabled);
  const setEnabled = useDjStore((state) => state.setEnabled);

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          DJ mode
        </Text>
        <Text selectable style={styles.description}>
          Keep optional song libraries for characters, friends, scripts, and each game session.
          Nothing plays automatically.
        </Text>
      </View>
      <Switch
        accessibilityLabel="DJ mode"
        accessibilityRole="switch"
        accessibilityState={{ checked: enabled }}
        onValueChange={setEnabled}
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
