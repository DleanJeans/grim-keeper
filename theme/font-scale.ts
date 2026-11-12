import { createPercentSetting } from '@/theme/percent-setting';

/** Font size as a percentage of the default, picked with the slider in Settings. */
export const FONT_SCALE_PERCENT = { default: 100, max: 150, min: 70, step: 5 } as const;

const fontScale = createPercentSetting('grim-keeper-font-scale', FONT_SCALE_PERCENT);

export const getFontScalePercent = fontScale.getPercent;
export const setFontScalePercent = fontScale.setPercent;
/** The font size multiplier; text re-renders when it changes. */
export const useFontScale = fontScale.useMultiplier;
