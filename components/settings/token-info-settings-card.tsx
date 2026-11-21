import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { useTokenInfoStore } from '@/store/token-info-store';
import { colors } from '@/theme/colors';

/** Choose which personal info of a friend shows on their map token. */
export function TokenInfoSettingsCard() {
  const showBirthYear = useTokenInfoStore((state) => state.showBirthYear);
  const showCountry = useTokenInfoStore((state) => state.showCountry);
  const setShowBirthYear = useTokenInfoStore((state) => state.setShowBirthYear);
  const setShowCountry = useTokenInfoStore((state) => state.setShowCountry);

  return (
    <View style={styles.card}>
      <Text selectable style={styles.title}>
        Personal info on tokens
      </Text>
      <SettingRow
        description="Last two digits of their year of birth."
        label="Show birth year"
        onChange={setShowBirthYear}
        value={showBirthYear}
      />
      <SettingRow
        description="Flag of their country of origin."
        label="Show country flag"
        onChange={setShowCountry}
        value={showCountry}
      />
    </View>
  );
}

type SettingRowProps = {
  description: string;
  label: string;
  onChange: (value: boolean) => void;
  value: boolean;
};

function SettingRow({ description, label, onChange, value }: SettingRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text selectable style={styles.label}>
          {label}
        </Text>
        <Text selectable style={styles.description}>
          {description}
        </Text>
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onValueChange={onChange}
        thumbColor={value ? colors.primary : colors.onDisabled}
        trackColor={{ false: colors.disabled, true: colors.borderStrong }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  copy: { flex: 1, gap: 4 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  label: { color: colors.text, fontSize: 16, fontWeight: '800' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 20, fontWeight: '800' },
});
