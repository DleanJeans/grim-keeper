import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { preloadRoleData } from '../data/roleIcons';
import { useFriendStore } from '../hooks/useFriendStore';
import { useGameStore } from '../hooks/useGameStore';
import { useSavedScriptStore } from '../hooks/useSavedScriptStore';
import { useDevClear } from '../utils/devConfig';

export default function RootLayout() {
  const loadGames = useGameStore(s => s.loadGames);
  const loadFriends = useFriendStore(s => s.loadFriends);
  const loadScripts = useSavedScriptStore(s => s.loadScripts);

  const init = () => {
    loadGames();
    loadFriends();
    loadScripts();
    preloadRoleData();
  };

  useDevClear(init);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#1a1b1e',
      }}
    >
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#1a1b1e',
          },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen name="new-game" />
        <Stack.Screen name="game/[id]" />
        <Stack.Screen
          name="player/[id]"
          options={{
            presentation: 'modal',
          }}
        />
      </Stack>
    </View>
  );
}
