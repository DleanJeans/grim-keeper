import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ResponsiveContent } from '@/components/responsive-content';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import {
  createSharedGameTransfer,
  decodeSharedGame,
  findExistingSharedGame,
  findSharedPlayerIndex,
  getSharedScriptName,
  isDefaultAppUserName,
  type SharedGame,
} from '@/utils/share-game-link';

type DecodedShare =
  | { error: string; sharedGame?: undefined }
  | { error?: undefined; sharedGame: SharedGame };

export default function ShareGameRoute() {
  const { g } = useLocalSearchParams<{ g?: string }>();
  const router = useRouter();
  const appUserName = useGameStore((state) => state.appUserName);
  const importGameTransfer = useGameStore((state) => state.importGameTransfer);
  const setAppUserName = useGameStore((state) => state.setAppUserName);
  const handledRef = useRef(false);
  const [declinedMatch, setDeclinedMatch] = useState(false);
  const decoded = useMemo<DecodedShare>(() => {
    if (!g) {
      return { error: 'This link has no game in it. Ask for the link again.' };
    }

    try {
      return { sharedGame: decodeSharedGame(g) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'This share link is broken.' };
    }
  }, [g]);
  const sharedGame = decoded.sharedGame;
  const nameMatchIndex = sharedGame ? findSharedPlayerIndex(sharedGame, appUserName) : undefined;
  const matchedIndex = declinedMatch ? undefined : nameMatchIndex;

  function openGame(id: string) {
    router.replace({ pathname: '/game/[id]', params: { id } });
  }

  function joinAs(game: SharedGame, playerIndex: number) {
    handledRef.current = true;
    const existingGame = findExistingSharedGame(game, useGameStore.getState().games);
    if (existingGame) {
      openGame(existingGame.id);
      return;
    }

    // A first-time user has no name yet: take the one they picked, so the next link finds them.
    const pickedName = game.p[playerIndex][0];
    const name = isDefaultAppUserName(appUserName) ? pickedName : appUserName;
    if (name !== appUserName) {
      setAppUserName(name);
    }

    const gameId = importGameTransfer(
      createSharedGameTransfer(game, playerIndex, name, useGameStore.getState().scripts),
    );
    if (gameId) {
      openGame(gameId);
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per link, openGame only navigates.
  useEffect(() => {
    if (handledRef.current || !sharedGame) {
      return;
    }

    const existingGame = findExistingSharedGame(sharedGame, useGameStore.getState().games);
    if (existingGame) {
      handledRef.current = true;
      openGame(existingGame.id);
    }
  }, [sharedGame]);

  const seatedPlayers = sharedGame
    ? sharedGame.p.flatMap((player, index) => (player[4] ? [] : [{ index, name: player[0] }]))
    : [];
  const scriptName = sharedGame ? getSharedScriptName(sharedGame) : undefined;

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title="Join game" />,
          title: 'Join game',
        }}
      />
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.screen}>
        <ResponsiveContent style={styles.content}>
          {decoded.error ? (
            <>
              <Text selectable style={styles.title}>
                Could not open this game
              </Text>
              <Text selectable style={styles.description}>
                {decoded.error}
              </Text>
            </>
          ) : sharedGame && matchedIndex !== undefined ? (
            <>
              <Text selectable style={styles.description}>
                {[scriptName, `${seatedPlayers.length} players`].filter(Boolean).join(' · ')}
              </Text>
              <Text selectable style={styles.title}>
                Are you {sharedGame.p[matchedIndex][0]}?
              </Text>
              <Text selectable style={styles.description}>
                The map turns so your token sits at the bottom.
              </Text>
              <View style={styles.list}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => joinAs(sharedGame, matchedIndex)}
                  style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
                >
                  <Text style={styles.confirmText}>Yes, I am {sharedGame.p[matchedIndex][0]}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDeclinedMatch(true)}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                >
                  <Text style={styles.optionText}>No, pick someone else</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text selectable style={styles.description}>
                {[scriptName, `${seatedPlayers.length} players`].filter(Boolean).join(' · ')}
              </Text>
              <Text selectable style={styles.title}>
                Who are you?
              </Text>
              <Text selectable style={styles.description}>
                Pick your name. The map turns so your token sits at the bottom.
              </Text>
              <View style={styles.list}>
                {seatedPlayers.map((player) => (
                  <SharedPlayerOption
                    key={player.index}
                    name={player.name}
                    onPress={() => sharedGame && joinAs(sharedGame, player.index)}
                  />
                ))}
              </View>
            </>
          )}
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  confirm: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderCurve: 'continuous',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  confirmPressed: {
    backgroundColor: colors.surfacePressed,
  },
  confirmText: {
    color: colors.onPrimary,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '800',
  },
  content: {
    gap: 12,
    padding: 20,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  list: {
    gap: 8,
    marginTop: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  optionText: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: '700',
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
});

function SharedPlayerOption({ name, onPress }: { name: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`I am ${name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
    >
      <Text numberOfLines={1} style={styles.optionText}>
        {name}
      </Text>
      <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.4} />
    </Pressable>
  );
}
