import type { ReactNode } from 'react';
import {
  Platform,
  type StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

import { DESKTOP_CONTENT_MAX_WIDTH, isDesktopWeb } from '@/utils/responsive-utils';

type ResponsiveContentProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ResponsiveContent({ children, style }: ResponsiveContentProps) {
  const { width } = useWindowDimensions();
  const desktop = isDesktopWeb(width, Platform.OS);

  return <View style={[styles.content, desktop && styles.desktopContent, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
  },
  desktopContent: {
    alignSelf: 'center',
    maxWidth: DESKTOP_CONTENT_MAX_WIDTH,
  },
});
