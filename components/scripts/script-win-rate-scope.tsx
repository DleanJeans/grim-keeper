import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export type WinRateScope = 'all' | 'game';
export type WinRateRange = 'all' | 'script';

type ScopeOption<T extends string> = { description: string; label: string; scope: T };

export const WHO_OPTIONS: Array<ScopeOption<WinRateScope>> = [
  { description: 'only the players in this game', label: 'This game', scope: 'game' },
  { description: 'every friend', label: 'All friends', scope: 'all' },
];

export const RANGE_OPTIONS: Array<ScopeOption<WinRateRange>> = [
  { description: 'only games on this script', label: 'This script', scope: 'script' },
  { description: 'games on every script', label: 'All scripts', scope: 'all' },
];

type ScriptWinRateScopeProps<T extends string> = {
  label: string;
  onChange: (scope: T) => void;
  options: Array<ScopeOption<T>>;
  scope: T;
};

export function ScriptWinRateScope<T extends string>({
  label,
  onChange,
  options,
  scope,
}: ScriptWinRateScopeProps<T>) {
  return (
    <View accessibilityLabel={label} accessibilityRole="toolbar" style={styles.row}>
      {options.map((option) => (
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
