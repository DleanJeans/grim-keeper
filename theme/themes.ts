export const THEME_IDS = ['grim', 'clocktower', 'moonlit'] as const;

export const DEFAULT_THEME_ID: ThemeId = 'grim';

type ThemeColorKey =
  | 'background'
  | 'surface'
  | 'surfaceRaised'
  | 'surfacePressed'
  | 'border'
  | 'borderStrong'
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'primary'
  | 'onPrimary'
  | 'disabled'
  | 'onDisabled'
  | 'inputBackground'
  | 'inputBorder'
  | 'inputText'
  | 'inputPlaceholder'
  | 'noteText'
  | 'noteDayHeader'
  | 'roleInfoTokenBackground'
  | 'roleInfoTokenBorder'
  | 'roleInfoTokenEmptyBorder';

export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeDefinition = {
  label: string;
  /** Colors that replace the base palette; anything missing keeps the Grim value. */
  palette: Partial<Record<ThemeColorKey, string>>;
  /** Swatch shown in the Settings picker: [background, accent]. */
  swatch: [string, string];
};

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  grim: {
    label: 'Grim',
    palette: {},
    swatch: ['#0b0d10', '#f4f1ea'],
  },
  clocktower: {
    label: 'Clocktower',
    palette: {
      background: '#120a0a',
      surface: '#1b1010',
      surfaceRaised: '#241515',
      surfacePressed: '#2f1b1b',
      border: '#3d2424',
      borderStrong: '#5a3232',
      text: '#f3e6cf',
      textMuted: '#bfa98a',
      textSubtle: '#8a7560',
      primary: '#d4a64a',
      onPrimary: '#1a0f05',
      disabled: '#2a1a1a',
      onDisabled: '#8a7560',
      inputBackground: '#1a0e0e',
      inputBorder: '#4a2a2a',
      inputText: '#f8eedd',
      inputPlaceholder: '#8a6f5a',
      noteText: '#e2d3bb',
      noteDayHeader: '#b89a76',
      roleInfoTokenBackground: '#221313',
      roleInfoTokenBorder: '#6b4a3a',
      roleInfoTokenEmptyBorder: '#4a2f2a',
    },
    swatch: ['#120a0a', '#d4a64a'],
  },
  moonlit: {
    label: 'Moonlit',
    palette: {
      background: '#0a0f1a',
      surface: '#101827',
      surfaceRaised: '#162033',
      surfacePressed: '#1d2a40',
      border: '#26354d',
      borderStrong: '#36496a',
      text: '#e8eefb',
      textMuted: '#9aa8c2',
      textSubtle: '#6b7a95',
      primary: '#c7d7f5',
      onPrimary: '#0a1020',
      disabled: '#1e293b',
      onDisabled: '#6b7a95',
      inputBackground: '#0d1526',
      inputBorder: '#2c3d5a',
      inputText: '#f1f5fd',
      inputPlaceholder: '#5e6f8d',
      roleInfoTokenBackground: '#141d2e',
      roleInfoTokenBorder: '#4d5f7d',
      roleInfoTokenEmptyBorder: '#2f3e57',
    },
    swatch: ['#0a0f1a', '#c7d7f5'],
  },
};

export function parseThemeId(value: unknown): ThemeId {
  return THEME_IDS.find((themeId) => themeId === value) ?? DEFAULT_THEME_ID;
}

export function applyTheme<T extends Record<string, unknown>>(base: T, themeId: ThemeId): T {
  return { ...base, ...THEMES[themeId].palette };
}
