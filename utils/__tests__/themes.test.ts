import { applyTheme, DEFAULT_THEME_ID, parseThemeId, THEME_IDS, THEMES } from '@/theme/themes';

describe('themes', () => {
  it('falls back to the default theme for unknown stored values', () => {
    expect(parseThemeId(undefined)).toBe(DEFAULT_THEME_ID);
    expect(parseThemeId(null)).toBe(DEFAULT_THEME_ID);
    expect(parseThemeId('neon')).toBe(DEFAULT_THEME_ID);
    expect(parseThemeId('clocktower')).toBe('clocktower');
  });

  it('overrides only the palette keys and keeps the rest of the base colors', () => {
    const base = { background: '#000000', roleClaim: '#fcd34d', nested: { icon: '#ffffff' } };
    const themed = applyTheme(base, 'clocktower');

    expect(themed.background).toBe(THEMES.clocktower.palette.background);
    expect(themed.roleClaim).toBe('#fcd34d');
    expect(themed.nested).toBe(base.nested);
    expect(applyTheme(base, 'grim')).toEqual(base);
  });

  it('defines a label and swatch for every theme', () => {
    for (const themeId of THEME_IDS) {
      expect(THEMES[themeId].label).toBeTruthy();
      expect(THEMES[themeId].swatch).toHaveLength(2);
    }
  });
});
