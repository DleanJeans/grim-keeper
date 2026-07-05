import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
};

export default function RootLayout() {
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
            headerTitleStyle: { color: colors.text },
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
