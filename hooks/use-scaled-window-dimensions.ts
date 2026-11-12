import { useWindowDimensions } from 'react-native';

import { useUiScale } from '@/theme/display-scale';

/** The window size in the units the app lays out in, once the UI size from Settings applies. */
export function useScaledWindowDimensions() {
  const window = useWindowDimensions();
  const scale = useUiScale();

  return scale === 1
    ? window
    : { ...window, height: window.height / scale, width: window.width / scale };
}
