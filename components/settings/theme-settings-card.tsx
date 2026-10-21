import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { applyThemeAndReload, readStoredThemeId } from '@/theme/theme-storage';
import { THEME_IDS, THEMES, type ThemeId } from '@/theme/themes';

type ThemeOptionProps = {
  onSelect: (themeId: ThemeId) => void;
  selected: boolean;
  themeId: ThemeId;
};

export function ThemeSettingsCard() {
  const activeThemeId = readStoredThemeId();

  const handleSelect = (themeId: ThemeId) => {
    if (themeId !== activeThemeId) {
      void applyThemeAndReload(themeId);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.copy}>
        <Text selectable style={styles.title}>
          Theme
        </Text>
        <Text selectable style={styles.description}>
          Changes the colors across the app. The app reloads to apply it.
        </Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.options}>
        {THEME_IDS.map((themeId) => (
          <ThemeOption
            key={themeId}
            onSelect={handleSelect}
            selected={themeId === activeThemeId}
            themeId={themeId}
          />
        ))}
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
    gap: 14,
    padding: 16,
  },
  copy: {
    gap: 6,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  optionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  optionSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    borderColor: colors.borderStrong,
    borderRadius: 11,
    borderWidth: 1,
    flexDirection: 'row',
    height: 22,
    overflow: 'hidden',
    width: 22,
  },
  swatchHalf: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});

const swatchBackgroundStyles = StyleSheet.create(
  mapThemes((themeId) => ({ backgroundColor: THEMES[themeId].swatch[0] })),
);

const swatchAccentStyles = StyleSheet.create(
  mapThemes((themeId) => ({ backgroundColor: THEMES[themeId].swatch[1] })),
);

function ThemeOption({ onSelect, selected, themeId }: ThemeOptionProps) {
  const theme = THEMES[themeId];

  return (
    <Pressable
      accessibilityLabel={`${theme.label} theme`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={() => onSelect(themeId)}
      style={({ pressed }) => [
        styles.option,
        pressed && styles.optionPressed,
        selected && styles.optionSelected,
      ]}
    >
      <View style={styles.swatch}>
        <View style={[styles.swatchHalf, swatchBackgroundStyles[themeId]]} />
        <View style={[styles.swatchHalf, swatchAccentStyles[themeId]]} />
      </View>
      <Text style={styles.optionLabel}>{theme.label}</Text>
    </Pressable>
  );
}

function mapThemes(getStyle: (themeId: ThemeId) => ViewStyle) {
  return Object.fromEntries(THEME_IDS.map((themeId) => [themeId, getStyle(themeId)])) as Record<
    ThemeId,
    ViewStyle
  >;
}
