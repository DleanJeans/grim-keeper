import { requireOptionalNativeModule } from 'expo';
import { useEffect } from 'react';

// APKs built before expo-navigation-bar was added don't have its native module, and an update
// sent over the air still reaches them, so the module is only loaded when the APK has it.
const hasNavigationBar =
  process.env.EXPO_OS === 'android' && requireOptionalNativeModule('ExpoNavigationBar') != null;

/** Hides the Android system navigation bar; a swipe up from the bottom shows it for a moment. */
export function HiddenNavigationBar() {
  useEffect(() => {
    if (!hasNavigationBar) return;
    const { NavigationBar } =
      require('expo-navigation-bar') as typeof import('expo-navigation-bar');
    NavigationBar.setHidden(true);
  }, []);

  return null;
}
