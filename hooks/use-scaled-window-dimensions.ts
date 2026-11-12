import { useWindowDimensions } from 'react-native';

import { useUiScale } from '@/theme/ui-scale';

/** The window size in the app's own units, which change with the UI size picked in Settings. */
export function useScaledWindowDimensions() {
  const window = useWindowDimensions();
  const scale = useUiScale();

  return { ...window, height: window.height / scale, width: window.width / scale };
}
