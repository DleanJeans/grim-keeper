import 'expo-sqlite/localStorage/install';
import * as Updates from 'expo-updates';
import { DevSettings, Platform } from 'react-native';

import { parseThemeId, type ThemeId } from '@/theme/themes';

// Kept outside the zustand stores: styles read colors at module load, before hydration, so the
// theme must be readable synchronously.
const THEME_STORAGE_KEY = 'grim-keeper-theme';

export function readStoredThemeId(): ThemeId {
  try {
    return parseThemeId(globalThis.localStorage?.getItem(THEME_STORAGE_KEY));
  } catch {
    return parseThemeId(undefined);
  }
}

/** Saves the theme and reloads the app, since styles only pick up colors when they load. */
export async function applyThemeAndReload(themeId: ThemeId) {
  globalThis.localStorage?.setItem(THEME_STORAGE_KEY, themeId);

  if (Platform.OS === 'web') {
    globalThis.location?.reload();
    return;
  }

  try {
    await Updates.reloadAsync();
  } catch {
    DevSettings.reload();
  }
}
