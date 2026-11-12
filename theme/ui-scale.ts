import { createPercentSetting } from '@/theme/percent-setting';

/** Size of the whole UI (layout, icons and text) as a percentage, picked in Settings. */
export const UI_SCALE_PERCENT = { default: 100, max: 120, min: 60, step: 5 } as const;

const uiScale = createPercentSetting('grim-keeper-ui-scale', UI_SCALE_PERCENT);

export const getUiScalePercent = uiScale.getPercent;
export const setUiScalePercent = uiScale.setPercent;
/** The UI size multiplier; the app re-renders at the new size when it changes. */
export const useUiScale = uiScale.useMultiplier;
