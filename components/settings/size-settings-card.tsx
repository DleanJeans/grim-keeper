import { Pressable, StyleSheet, View } from 'react-native';

import { DimensionSlider } from '@/components/game/dimension-slider';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type SizeSettingsCardProps = {
  description: string;
  onChange: (percent: number) => void;
  /** The setting's current value, in percent. */
  percent: number;
  range: { default: number; max: number; min: number; step: number };
  title: string;
};

/** A Settings card with a percentage slider and a Reset button, such as Font size. */
export function SizeSettingsCard({
  description,
  onChange,
  percent,
  range,
  title,
}: SizeSettingsCardProps) {
  const isDefault = percent === range.default;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.copy}>
          <Text selectable style={styles.title}>
            {title}
          </Text>
          <Text selectable style={styles.description}>
            {description}
          </Text>
        </View>
        {isDefault ? null : (
          <Pressable
            accessibilityLabel={`Reset ${title.toLowerCase()}`}
            accessibilityRole="button"
            onPress={() => onChange(range.default)}
            style={({ pressed }) => [styles.resetButton, pressed && styles.resetButtonPressed]}
          >
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        )}
      </View>
      <DimensionSlider
        accessibilityLabel={title}
        formatValue={(value) => `${value}%`}
        label="Size"
        max={range.max}
        min={range.min}
        onChange={onChange}
        step={range.step}
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
