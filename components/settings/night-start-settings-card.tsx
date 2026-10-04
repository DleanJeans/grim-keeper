import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';

export function NightStartSettingsCard() {
  const defaultStartingNight = useGameStore((state) => state.defaultStartingNight);
  const setDefaultStartingNight = useGameStore((state) => state.setDefaultStartingNight);
  const startsAtNightZero = defaultStartingNight === 0;

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Start at Night 0
        </Text>
        <Text selectable style={styles.description}>
          Use Night 0 labels across all games, including saved games.
        </Text>
      </View>
      <Switch
        accessibilityLabel="Show Night 0 labels for all games"
        accessibilityRole="switch"
        accessibilityState={{ checked: startsAtNightZero }}
        onValueChange={(enabled) => setDefaultStartingNight(enabled ? 0 : 1)}
        trackColor={{ false: colors.disabled, true: colors.borderStrong }}
        value={startsAtNightZero}
        thumbColor={startsAtNightZero ? colors.primary : colors.onDisabled}
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
