import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DimensionSlider } from '@/components/game/dimension-slider';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import {
  SCALE_PERCENT,
  setFontScalePercent,
  setUiScalePercent,
  useFontScale,
  useUiScale,
} from '@/theme/display-scale';

/** The whole screen resizes under the finger, so the UI size waits for the slider to settle. */
const UI_SCALE_APPLY_DELAY_MS = 500;

export function SizeSettingsCard() {
  const fontPercent = Math.round(useFontScale() * 100);
  const uiPercent = Math.round(useUiScale() * 100);
  const [pendingUiPercent, setPendingUiPercent] = useState<number>();
  const shownUiPercent = pendingUiPercent ?? uiPercent;
  const isDefault =
    fontPercent === SCALE_PERCENT.default && shownUiPercent === SCALE_PERCENT.default;

  useEffect(() => {
    if (pendingUiPercent === undefined) return;
    const timeout = setTimeout(() => {
      setUiScalePercent(pendingUiPercent);
      setPendingUiPercent(undefined);
    }, UI_SCALE_APPLY_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [pendingUiPercent]);

  const reset = () => {
    setPendingUiPercent(undefined);
    setUiScalePercent(SCALE_PERCENT.default);
    setFontScalePercent(SCALE_PERCENT.default);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text selectable style={styles.title}>
            Size
          </Text>
          <Text selectable style={styles.description}>
            App resizes everything: buttons, icons, spacing and text. Text resizes only the text.
          </Text>
        </View>
        {isDefault ? null : (
          <Pressable
            accessibilityLabel="Reset sizes"
            accessibilityRole="button"
            onPress={reset}
            style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        )}
      </View>
      <View>
        <DimensionSlider
          accessibilityLabel="App size"
          formatValue={formatPercent}
          label="App"
          max={SCALE_PERCENT.max}
          min={SCALE_PERCENT.min}
          onChange={setPendingUiPercent}
          step={SCALE_PERCENT.step}
          value={shownUiPercent}
        />
        <DimensionSlider
          accessibilityLabel="Text size"
          formatValue={formatPercent}
          label="Text"
          max={SCALE_PERCENT.max}
          min={SCALE_PERCENT.min}
          onChange={setFontScalePercent}
          step={SCALE_PERCENT.step}
          value={fontPercent}
        />
      </View>
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
    gap: 10,
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
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resetButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  resetText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});

function formatPercent(value: number) {
  return `${value}%`;
}
