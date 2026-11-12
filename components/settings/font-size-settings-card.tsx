import { Pressable, StyleSheet, View } from 'react-native';

import { DimensionSlider } from '@/components/game/dimension-slider';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { FONT_SCALE_PERCENT, setFontScalePercent, useFontScale } from '@/theme/font-scale';

export function FontSizeSettingsCard() {
  const percent = Math.round(useFontScale() * 100);
  const isDefault = percent === FONT_SCALE_PERCENT.default;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text selectable style={styles.title}>
            Font size
          </Text>
          <Text selectable style={styles.description}>
            Makes text across the app smaller or larger.
          </Text>
        </View>
        {isDefault ? null : (
          <Pressable
            accessibilityLabel="Reset font size"
            accessibilityRole="button"
            onPress={() => setFontScalePercent(FONT_SCALE_PERCENT.default)}
            style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        )}
      </View>
      <DimensionSlider
        accessibilityLabel="Font size"
        formatValue={(value) => `${value}%`}
        label="Size"
        max={FONT_SCALE_PERCENT.max}
        min={FONT_SCALE_PERCENT.min}
        onChange={setFontScalePercent}
        step={FONT_SCALE_PERCENT.step}
        value={percent}
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
