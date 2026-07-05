import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { GameMap } from '@/components/game-map';
import { getGameById, useGameStore } from '@/store/game-store';

export default function GameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const games = useGameStore((state) => state.games);
  const updatePlayerPosition = useGameStore((state) => state.updatePlayerPosition);
  const game = getGameById(games, id);
  const mapSize = Math.min(width - 40, 520);

  if (!game) {
    return (
      <View
        style={{
          alignItems: 'center',
          backgroundColor: '#0b1120',
          flex: 1,
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Stack.Screen options={{ title: 'Game not found' }} />
        <Text selectable style={{ color: '#f8fafc', fontSize: 17, fontWeight: '700' }}>
          Game not found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: '#0b1120', flex: 1 }}
      contentContainerStyle={{ gap: 20, padding: 20, paddingBottom: 40 }}
    >
      <Stack.Screen options={{ title: `Day ${game.activeDay}` }} />

      <Text selectable style={{ color: '#94a3b8', fontSize: 15, lineHeight: 21 }}>
        Long press a token to move it around the circle.
      </Text>

      <GameMap
        mapSize={mapSize}
        players={game.players}
        onMovePlayer={(playerId, position) => updatePlayerPosition(game.id, playerId, position)}
      />
    </ScrollView>
  );
}
