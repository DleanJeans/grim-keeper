import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export type WinRateScope = 'all' | 'game';

const SCOPE_OPTIONS: Array<{ description: string; label: string; scope: WinRateScope }> = [
  { description: 'only the players in this game', label: 'This game', scope: 'game' },
  { description: 'every friend', label: 'All friends', scope: 'all' },
];

type ScriptWinRateScopeProps = {
  onChange: (scope: WinRateScope) => void;
  scope: WinRateScope;
};

export function ScriptWinRateScope({ onChange, scope }: ScriptWinRateScopeProps) {
  return (
    <View accessibilityLabel="Choose who to show" accessibilityRole="toolbar" style={styles.row}>
      {SCOPE_OPTIONS.map((option) => (
        <ScopeButton
          accessibilityLabel={`Show ${option.description}`}
          key={option.scope}
          label={option.label}
          onPress={() => onChange(option.scope)}
          selected={scope === option.scope}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 6,
    flex: 1,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 4,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonSelected: {
    backgroundColor: colors.inputText,
  },
  buttonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  buttonTextSelected: {
    color: colors.onPrimary,
  },
  row: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
});

function ScopeButton({
  accessibilityLabel,
  label,
  onPress,
  selected,
}: {
  accessibilityLabel: string;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        selected && styles.buttonSelected,
      ]}
    >
      <Text style={[styles.buttonText, selected && styles.buttonTextSelected]}>{label}</Text>
    </Pressable>
  );
}
