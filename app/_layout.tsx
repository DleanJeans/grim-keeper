import AsyncStorage from '@react-native-async-storage/async-storage';
import { useURL } from 'expo-linking';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { LogBox, View } from 'react-native';
import { preloadRoleData } from '../data/roleIcons';
import { useFriendStore } from '../hooks/useFriendStore';
import { useGameStore } from '../hooks/useGameStore';
import { useSavedScriptStore } from '../hooks/useSavedScriptStore';

// Suppress Reanimated reduced motion LogBox toast in dev mode
LogBox.ignoreLogs(['[Reanimated] Reduced motion setting']);

export default function RootLayout() {
  const loadGames = useGameStore(s => s.loadGames);
  const loadFriends = useFriendStore(s => s.loadFriends);
  const loadScripts = useSavedScriptStore(s => s.loadScripts);

  const url = useURL();
  const cleared = useRef(false);

  const init = () => {
    loadGames();
    loadFriends();
    loadScripts();
    preloadRoleData();
  };

  useEffect(() => {
    if (cleared.current) return;
    if (url?.includes('clear=true')) {
      cleared.current = true;
      AsyncStorage.clear().then(init);
    } else {
      init();
    }
  }, [url, loadScripts, loadGames, loadFriends]);

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
