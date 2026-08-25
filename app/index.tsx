import { router, Stack } from 'expo-router';
import { Plus, ScrollText, Users } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppUserNameCard } from '@/components/app-user-name-card';
import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { HomeGameStats } from '@/components/home/home-game-stats';
import { HomeHeaderActions } from '@/components/home/home-header-actions';
import { ResponsiveContent } from '@/components/responsive-content';
import { SavedGameRow } from '@/components/saved-game-row';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function HomeRoute() {
  const showDialog = useAppDialog();
  const appUserName = useGameStore((state) => state.appUserName);
  const games = useGameStore((state) => state.games);
  const storedFriends = useGameStore((state) => state.friends);
  const scripts = useGameStore((state) => state.scripts);
  const deleteGame = useGameStore((state) => state.deleteGame);
  const setAppUserName = useGameStore((state) => state.setAppUserName);
  const friends = useMemo(
    () => getFriendSummaries(games, storedFriends, appUserName),
    [appUserName, games, storedFriends],
  );

  function confirmDeleteGame(gameId: string) {
    showDialog('Delete saved game?', 'This removes the game and all tracked data.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteGame(gameId),
      },
    ]);
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <TitleHeader right={<HomeHeaderActions />} showBack={false} title="Grim Keeper" />
          ),
          title: 'Grim Keeper',
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background, flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ResponsiveContent style={styles.content}>
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

          <HomeActionButton
            count={scripts.length}
            icon="scripts"
            label="Scripts"
            onPress={() => router.push('/scripts')}
          />

          <View style={{ gap: 12 }}>
            <HomeGameStats />

            <Text
              selectable
              style={{ color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' }}
            >
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
                <SavedGameRow key={game.id} game={game} onDelete={confirmDeleteGame} />
              ))
            )}
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 24,
    padding: 20,
  },
});

function HomeActionButton({
  icon,
  label,
  onPress,
  count,
}: {
  count?: number;
  icon: 'plus' | 'scripts' | 'users';
  label: string;
  onPress: () => void;
}) {
  const Icon = icon === 'plus' ? Plus : icon === 'scripts' ? ScrollText : Users;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={count === undefined ? undefined : { text: String(count) }}
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
