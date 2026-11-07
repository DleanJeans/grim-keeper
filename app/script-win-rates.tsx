import { Stack, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FriendRow } from '@/components/friends/friend-row';
import { FriendSortControls } from '@/components/friends/friend-sort-controls';
import { NotFoundScreen } from '@/components/not-found-screen';
import { ResponsiveContent } from '@/components/responsive-content';
import { ScriptWinRateScope, type WinRateScope } from '@/components/scripts/script-win-rate-scope';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendSummary } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import {
  type FriendSort,
  getFriendSummaries,
  rankFriendsByWinRate,
  sortFriendSummaries,
} from '@/utils/friend-utils';
import { getFriendStats } from '@/utils/game-utils';
import { APP_USER_ID } from '@/utils/object-id';
import { DEFAULT_SCRIPT_MIN_GAMES, getGamePlayerIds, getScriptGames } from '@/utils/script-utils';

export default function ScriptWinRatesRoute() {
  const { gameId, scriptId } = useLocalSearchParams<{ gameId?: string; scriptId: string }>();
  const appUserName = useGameStore((state) => state.appUserName);
  const allGames = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const storedFriends = useGameStore((state) => state.friends);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const game = gameId ? allGames.find((item) => item.id === gameId) : undefined;
  const [scope, setScope] = useState<WinRateScope>(game ? 'game' : 'all');
  const [sort, setSort] = useState<FriendSort>('winRate');
  // Only a handful of people sit at one table, so the game scope shows everyone with a rate.
  const [minGames, setMinGames] = useState(game ? 1 : DEFAULT_SCRIPT_MIN_GAMES);
  const scriptName =
    scripts.find((item) => item.id === scriptId)?.name ??
    (game?.script?.id === scriptId ? game.script.name : undefined) ??
    allGames.find((item) => item.script?.id === scriptId)?.script?.name;
  const games = useMemo(() => getScriptGames(allGames, scriptId), [allGames, scriptId]);
  const ratedGames = games.filter((item) => item.result !== undefined).length;
  const gamePlayerIds = useMemo(() => (game ? getGamePlayerIds(game) : null), [game]);
  const ranking = useMemo(() => {
    const scriptFriends = getFriendSummaries(games, storedFriends, appUserName).filter(
      (friend) => friend.gamesPlayed > 0,
    );
    // Your own row joins the ranking, so you can see where you stand.
    const you: FriendSummary = {
      createdAt: '',
      gamesPlayed: games.length,
      gamesStorytold: 0,
      id: APP_USER_ID,
      name: normalizePlayerName(appUserName) || 'You',
    };
    const everyone = games.length > 0 ? [...scriptFriends, you] : scriptFriends;
    const people =
      scope === 'game' && gamePlayerIds
        ? everyone.filter((friend) => gamePlayerIds.has(friend.id))
        : everyone;

    if (sort === 'games') {
      return { friends: sortFriendSummaries(people, savedNotes), hiddenCount: 0 };
    }

    const result = rankFriendsByWinRate(people, games, sort, minGames);
    const youHidden = people.includes(you) && you.gamesPlayed < Math.max(1, minGames);
    return { ...result, hiddenCount: result.hiddenCount - (youHidden ? 1 : 0) };
  }, [appUserName, gamePlayerIds, games, minGames, savedNotes, scope, sort, storedFriends]);
  const unratedPlayers = useMemo(() => {
    if (scope !== 'game' || !game) return [];
    return game.players
      .filter(
        (player) =>
          !player.isStoryteller &&
          player.id !== APP_USER_ID &&
          getFriendStats(games, player.id).completedGames === 0,
      )
      .map((player) => normalizePlayerName(player.name))
      .filter(Boolean);
  }, [game, games, scope]);

  if (!scriptName) {
    return <NotFoundScreen message="Script not found." title="Script not found" />;
  }

  const hiddenLabel = `${ranking.hiddenCount} ${
    ranking.hiddenCount === 1 ? 'friend' : 'friends'
  } with fewer than ${minGames} ${minGames === 1 ? 'game' : 'games'} hidden.`;

  return (
    <>
      <Stack.Screen
        options={{ header: () => <TitleHeader title={scriptName} />, title: scriptName }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        style={styles.scrollView}
      >
        <ResponsiveContent style={styles.content}>
          <Text selectable style={styles.subtitle}>
            Win rates · {ratedGames} {ratedGames === 1 ? 'game' : 'games'} with a result
          </Text>
          {game ? <ScriptWinRateScope onChange={setScope} scope={scope} /> : null}
          <FriendSortControls
            minGames={minGames}
            onChangeMinGames={setMinGames}
            onChangeSort={setSort}
            sort={sort}
          />
          <View style={styles.list}>
            {ranking.friends.length === 0 ? (
              <Text selectable style={styles.emptyText}>
                {games.length === 0
                  ? 'No games on this script yet.'
                  : 'Nobody has a rate for this view yet.'}
              </Text>
            ) : (
              ranking.friends.map((friend, index) => (
                <FriendRow
                  friend={friend}
                  games={games}
                  isYou={friend.id === APP_USER_ID}
                  key={friend.id}
                  rank={index + 1}
                />
              ))
            )}
            {ranking.hiddenCount > 0 ? (
              <Text selectable style={styles.noteText}>
                {hiddenLabel}
              </Text>
            ) : null}
            {unratedPlayers.length > 0 ? (
              <Text selectable style={styles.noteText}>
                No finished games on this script yet: {unratedPlayers.join(', ')}.
              </Text>
            ) : null}
          </View>
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 20,
    paddingBottom: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  scrollView: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
