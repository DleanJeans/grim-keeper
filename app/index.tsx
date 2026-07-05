import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useGameStore } from '@/store/game-store';

export default function HomeRoute() {
  const games = useGameStore((state) => state.games);

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: '#0b1120', flex: 1 }}
      contentContainerStyle={{ gap: 24, padding: 20, paddingBottom: 40 }}
    >
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/create')}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? '#f8fafc' : '#ffffff',
          borderRadius: 8,
          borderCurve: 'continuous',
          paddingHorizontal: 18,
          paddingVertical: 14,
        })}
      >
        <Text style={{ color: '#0b1120', fontSize: 17, fontWeight: '800' }}>New Game</Text>
      </Pressable>

      <View style={{ gap: 12 }}>
        <Text selectable style={{ color: '#f8fafc', fontSize: 22, fontWeight: '800' }}>
          Previous games
        </Text>

        {games.length === 0 ? (
          <View
            style={{
              backgroundColor: '#111827',
              borderColor: '#1f2937',
              borderRadius: 8,
              borderWidth: 1,
              padding: 16,
            }}
          >
            <Text selectable style={{ color: '#94a3b8', fontSize: 16, lineHeight: 22 }}>
              No games yet.
            </Text>
          </View>
        ) : (
          games.map((game) => (
            <Pressable
              key={game.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#1f2937' : '#111827',
                borderColor: '#334155',
                borderRadius: 8,
                borderWidth: 1,
                gap: 8,
                padding: 16,
              })}
            >
              <Text selectable style={{ color: '#f8fafc', fontSize: 17, fontWeight: '700' }}>
                {formatGameTitle(game.createdAt)}
              </Text>
              <Text selectable style={{ color: '#94a3b8', fontSize: 14 }}>
                {game.players.length} players - Day {game.activeDay}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function formatGameTitle(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(createdAt));
}
