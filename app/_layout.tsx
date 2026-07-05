import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useAppFonts } from '@/hooks/use-app-fonts';
import { colors } from '@/theme/colors';

const grimKeeperTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.background,
    notification: colors.danger,
    primary: colors.primary,
    text: colors.text,
  },
  fonts: {
    ...DarkTheme.fonts,
    bold: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '800' as const,
    },
    medium: {
      fontFamily: 'GoogleSans-Bold',
      fontWeight: '600' as const,
    },
    regular: {
      fontFamily: 'GoogleSans',
      fontWeight: '400' as const,
    },
  },
};

export default function RootLayout() {
  const fontsReady = useAppFonts();

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={grimKeeperTheme}>
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.background },
            headerLargeStyle: { backgroundColor: colors.background },
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerTitleStyle: {
              color: colors.text,
              fontFamily: 'GoogleSans-Bold',
              fontSize: 15,
            },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'GrimKeeper' }} />
          <Stack.Screen name="create" options={{ title: 'New Game' }} />
          <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
