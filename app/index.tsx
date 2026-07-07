import { router } from 'expo-router';
import { ChevronRight, Plus, Trash2, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';

import { AppUserNameCard } from '@/components/app-user-name-card';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function HomeRoute() {
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const deleteGame = useGameStore((state) => state.deleteGame);
  const setAppUserName = useGameStore((state) => state.setAppUserName);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );

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
      style={{ backgroundColor: colors.background, flex: 1 }}
      contentContainerStyle={{ gap: 24, padding: 20, paddingBottom: 40 }}
    >
      <AppUserNameCard appUserName={appUserName} onSave={setAppUserName} />

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <HomeActionButton icon="plus" label="New Game" onPress={() => router.push('/create')} />
        <HomeActionButton
          count={friends.length}
          icon="users"
          label="Friends"
          onPress={() => router.push('/friends')}
        />
      </View>

      <View style={{ gap: 12 }}>
        <Text selectable style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>
          Previous games
        </Text>

        {games.length === 0 ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: 1,
              padding: 16,
            }}
          >
            <Text selectable style={{ color: colors.textMuted, fontSize: 16, lineHeight: 22 }}>
              No games yet.
            </Text>
          </View>
        ) : (
          games.map((game) => (
            <View
              key={game.id}
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.borderStrong,
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
                  backgroundColor: pressed ? colors.surfacePressed : colors.surface,
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
                  <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '700' }}>
                    {formatGameTitle(game.createdAt)}
                  </Text>
                  <Text selectable style={{ color: colors.textMuted, fontSize: 14 }}>
                    {game.players.length} players - Day {game.activeDay}
                  </Text>
                </View>
                <ChevronRight color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
              <Pressable
                accessibilityLabel="Delete saved game"
                accessibilityRole="button"
                onPress={() => confirmDeleteGame(game.id)}
                style={({ pressed }) => ({
                  alignItems: 'center',
                  backgroundColor: pressed ? colors.dangerSurface : colors.surface,
                  borderBottomRightRadius: 8,
                  borderLeftColor: colors.borderStrong,
                  borderLeftWidth: 1,
                  borderTopRightRadius: 8,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                })}
              >
                <Trash2 color={colors.danger} size={18} strokeWidth={2.6} />
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function HomeActionButton({
  icon,
  label,
  onPress,
  count,
}: {
  count?: number;
  icon: 'plus' | 'users';
  label: string;
  onPress: () => void;
}) {
  const Icon = icon === 'plus' ? Plus : Users;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? colors.surfacePressed : colors.primary,
        borderRadius: 8,
        borderCurve: 'continuous',
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 14,
      })}
    >
      <Icon color={colors.onPrimary} size={18} strokeWidth={2.7} />
      <Text style={{ color: colors.onPrimary, fontSize: 16, fontWeight: '800' }}>{label}</Text>
      {count === undefined ? null : (
        <Text style={{ color: colors.onPrimary, fontSize: 14, fontVariant: ['tabular-nums'] }}>
          {count}
        </Text>
      )}
    </Pressable>
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
