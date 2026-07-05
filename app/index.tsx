import { router } from 'expo-router';
import { ChevronRight, Plus, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';

export default function HomeRoute() {
  const games = useGameStore((state) => state.games);
  const deleteGame = useGameStore((state) => state.deleteGame);

  function confirmDeleteGame(gameId: string) {
    Alert.alert('Delete saved game?', 'This removes the game and all tracked data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGame(gameId),
      },
    ]);
  }

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
          flexDirection: 'row',
          gap: 8,
          justifyContent: 'center',
          paddingHorizontal: 18,
          paddingVertical: 14,
        })}
      >
        <Plus color="#0b1120" size={18} strokeWidth={2.7} />
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
            <View
              key={game.id}
              style={{
                backgroundColor: '#111827',
                borderColor: '#334155',
                borderRadius: 8,
                borderWidth: 1,
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/game/[id]', params: { id: game.id } })}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#1f2937' : '#111827',
                  borderBottomLeftRadius: 8,
                  borderTopLeftRadius: 8,
                  flex: 1,
                  flexDirection: 'row',
                  gap: 8,
                  justifyContent: 'space-between',
                  padding: 16,
                })}
              >
                <View style={{ flex: 1, gap: 8 }}>
                  <Text selectable style={{ color: '#f8fafc', fontSize: 17, fontWeight: '700' }}>
                    {formatGameTitle(game.createdAt)}
                  </Text>
                  <Text selectable style={{ color: '#94a3b8', fontSize: 14 }}>
                    {game.players.length} players - Day {game.activeDay}
                  </Text>
                </View>
                <ChevronRight color="#94a3b8" size={18} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                accessibilityLabel="Delete saved game"
                accessibilityRole="button"
                onPress={() => confirmDeleteGame(game.id)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? '#2a1517' : '#111827',
                  borderBottomRightRadius: 8,
                  borderLeftColor: '#334155',
                  borderLeftWidth: 1,
                  borderTopRightRadius: 8,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                })}
              >
                <Trash2 color="#fca5a5" size={18} strokeWidth={2.6} />
              </Pressable>
            </View>
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
