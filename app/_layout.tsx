import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'GrimKeeper' }} />
        <Stack.Screen name="create" options={{ title: 'New Game' }} />
        <Stack.Screen name="game/[id]" options={{ title: 'Game' }} />
      </Stack>
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}
