import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ShareGameMap } from '@/components/create/share-game-map';
import { ShareScriptTokens } from '@/components/create/share-script-tokens';
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
  getSharedScriptRoles,
  isDefaultAppUserName,
  type SharedGame,
} from '@/utils/share-game-link';

// The page loads before the router has read the link, so a missing link is only believed after this.
const MISSING_LINK_GRACE_MS = 600;

type DecodedShare =
  | { error: string; sharedGame?: undefined }
  | { error?: undefined; sharedGame: SharedGame };

export default function ShareGameRoute() {
  const { g } = useLocalSearchParams<{ g?: string }>();
  const router = useRouter();
  const appUserName = useGameStore((state) => state.appUserName);
  const importGameTransfer = useGameStore((state) => state.importGameTransfer);
  const setAppUserName = useGameStore((state) => state.setAppUserName);
  const scripts = useGameStore((state) => state.scripts);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const handledRef = useRef(false);
  const insets = useSafeAreaInsets();
  const [declinedMatch, setDeclinedMatch] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [waitedForLink, setWaitedForLink] = useState(false);
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

  useEffect(() => {
    const timeout = setTimeout(() => setWaitedForLink(true), MISSING_LINK_GRACE_MS);
    return () => clearTimeout(timeout);
  }, []);

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

  function handleSelect(index: number) {
    // Picking someone else on the map or list turns down the name match.
    if (matchedIndex !== undefined) {
      if (index === matchedIndex) {
        return;
      }
      setDeclinedMatch(true);
    }
    setSelectedIndex(index);
  }

  const seatedPlayers = sharedGame
    ? sharedGame.p.flatMap((player, index) => (player[4] ? [] : [{ index, name: player[0] }]))
    : [];
  // The player who shared the game is not you, so they are not offered.
  const pickablePlayers = seatedPlayers.filter((player) => player.index !== sharedGame?.o);
  const selectedPlayer = pickablePlayers.find((player) => player.index === selectedIndex);
  const activeIndex = matchedIndex ?? selectedPlayer?.index;
  const scriptName = sharedGame ? getSharedScriptName(sharedGame) : undefined;
  const scriptRoles = useMemo(
    () => (sharedGame ? getSharedScriptRoles(sharedGame, scripts, roleCatalog) : []),
    [roleCatalog, scripts, sharedGame],
  );

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title="Join game" />,
          title: 'Join game',
        }}
      />
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scroll}>
          <ResponsiveContent style={styles.content}>
            {!g && !waitedForLink ? (
              <View accessibilityLabel="Loading game" style={styles.loading}>
                <ActivityIndicator
                  accessibilityLabel="Loading"
                  color={colors.primary}
                  size="large"
                />
                <Text style={styles.description}>Loading game…</Text>
              </View>
            ) : decoded.error ? (
              <>
                <Text selectable style={styles.title}>
                  Could not open this game
                </Text>
                <Text selectable style={styles.description}>
                  {decoded.error}
                </Text>
              </>
            ) : sharedGame ? (
              <>
                <Text selectable style={styles.description}>
                  {[scriptName, `${seatedPlayers.length} players`].filter(Boolean).join(' · ')}
                </Text>
                <ShareGameMap
                  onSelect={handleSelect}
                  pickableIndexes={pickablePlayers.map((player) => player.index)}
                  selectedIndex={activeIndex}
                  sharedGame={sharedGame}
                />
                {matchedIndex !== undefined ? (
                  <>
                    <Text selectable style={styles.title}>
                      Are you {sharedGame.p[matchedIndex][0]}?
                    </Text>
                    <Text selectable style={styles.description}>
                      The map turns so your token sits at the bottom. Tap another token to change.
                    </Text>
                    <View style={styles.list}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => joinAs(sharedGame, matchedIndex)}
                        style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
                      >
                        <Text style={styles.confirmText}>
                          Yes, I am {sharedGame.p[matchedIndex][0]}
                        </Text>
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
                    <Text selectable style={styles.title}>
                      Who are you?
                    </Text>
                    <Text selectable style={styles.description}>
                      Tap your token or your name. The map turns so your token sits at the bottom.
                    </Text>
                    <View style={styles.list}>
                      {pickablePlayers.map((player) => (
                        <SharedPlayerOption
                          key={player.index}
                          name={player.name}
                          onPress={() => handleSelect(player.index)}
                          selected={player.index === selectedIndex}
                        />
                      ))}
                    </View>
                  </>
                )}
                <ShareScriptTokens roles={scriptRoles} />
              </>
            ) : null}
          </ResponsiveContent>
        </ScrollView>
        {sharedGame && selectedPlayer && matchedIndex === undefined ? (
          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <Pressable
              accessibilityRole="button"
              onPress={() => joinAs(sharedGame, selectedPlayer.index)}
              style={({ pressed }) => [styles.confirm, pressed && styles.confirmPressed]}
            >
              <Text numberOfLines={1} style={styles.confirmText}>
                Yes, I am {selectedPlayer.name}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </View>
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
  loading: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 48,
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
  optionSelected: {
    backgroundColor: colors.surfacePressed,
    borderColor: colors.primary,
    borderWidth: 2,
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
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
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

function SharedPlayerOption({
  name,
  onPress,
  selected,
}: {
  name: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`I am ${name}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <Text numberOfLines={1} style={styles.optionText}>
        {name}
      </Text>
      {selected ? (
        <Check color={colors.primary} size={20} strokeWidth={3} />
      ) : (
        <ChevronRight color={colors.textMuted} size={20} strokeWidth={2.4} />
      )}
    </Pressable>
  );
}
