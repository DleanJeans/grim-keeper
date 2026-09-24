import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { DjCurrentSong } from '@/components/dj/dj-current-song';
import { type DjSongListItem, DjSongSection } from '@/components/dj/dj-song-section';
import { DjUrlEntry } from '@/components/dj/dj-url-entry';
import { ResponsiveContent } from '@/components/responsive-content';
import { Text } from '@/components/text';
import { TitleHeader } from '@/components/title-header';
import { useDjStore } from '@/store/dj-store';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import {
  GENERAL_DJ_TARGET,
  getDjGameSources,
  getDjSongs,
  getDjSongsForSources,
} from '@/utils/dj-utils';
import { getFriendSummaries } from '@/utils/friend-utils';

export default function DjRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const enabled = useDjStore((state) => state.enabled);
  const playlists = useDjStore((state) => state.playlists);
  const addSong = useDjStore((state) => state.addSong);
  const removeSong = useDjStore((state) => state.removeSong);
  const games = useGameStore((state) => state.games);
  const friends = useGameStore((state) => state.friends);
  const appUserName = useGameStore((state) => state.appUserName);
  const scripts = useGameStore((state) => state.scripts);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const game = games.find((candidate) => candidate.id === id);
  const script = game
    ? (game.script ??
      scripts.find((candidate) => candidate.id === (game.scriptId ?? game.script?.id)))
    : undefined;
  const gameSources = useMemo(() => {
    if (!game) {
      return [];
    }

    const sourceGame = script && !game.script ? { ...game, script } : game;
    const gameFriends = getFriendSummaries(games, friends, appUserName);
    return getDjGameSources(sourceGame, script?.roles ?? roleCatalog, gameFriends);
  }, [appUserName, friends, game, games, roleCatalog, script]);
  const aggregateItems = useMemo<DjSongListItem[]>(() => {
    return getDjSongsForSources(playlists, gameSources).sort((first, second) =>
      first.songUrl.localeCompare(second.songUrl),
    );
  }, [gameSources, playlists]);
  const generalSongs = getDjSongs(playlists, GENERAL_DJ_TARGET);

  if (!game) {
    return (
      <View style={styles.notFound}>
        <Stack.Screen options={{ title: 'DJ unavailable' }} />
        <Text selectable style={styles.notFoundText}>
          Game not found.
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <TitleHeader title="DJ mode" />,
          title: 'DJ mode',
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        style={styles.screen}
      >
        <ResponsiveContent style={styles.content}>
          {!enabled ? (
            <View style={styles.disabledCard}>
              <Text selectable style={styles.disabledTitle}>
                DJ mode is off
              </Text>
              <Text selectable style={styles.disabledMessage}>
                Turn it on in Settings to manage songs and session stats.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open DJ settings"
                onPress={() => router.push('/settings')}
                style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
              >
                <Text style={styles.settingsButtonText}>Open Settings</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <DjCurrentSong gameId={game.id} />
              <View style={styles.generalEditor}>
                <Text selectable style={styles.sectionTitle}>
                  General
                </Text>
                <Text selectable style={styles.sectionDescription}>
                  Songs here are part of the BOTC vibe for every game.
                </Text>
                <DjUrlEntry onAdd={(songUrl) => addSong(GENERAL_DJ_TARGET, songUrl)} />
                <Text selectable style={styles.generalCount}>
                  {generalSongs.length} {generalSongs.length === 1 ? 'song' : 'songs'} in General
                </Text>
              </View>
              <DjSongSection
                gameId={game.id}
                items={aggregateItems}
                canRemoveSong={(songUrl) => generalSongs.includes(songUrl)}
                onRemoveSong={(songUrl) => {
                  if (generalSongs.includes(songUrl)) {
                    removeSong(GENERAL_DJ_TARGET, songUrl);
                  }
                }}
                target={GENERAL_DJ_TARGET}
                title="Songs for this game"
              />
              {!aggregateItems.length ? (
                <Text selectable style={styles.emptyMessage}>
                  Add songs to General or to a character, friend, or script library to see them
                  here.
                </Text>
              ) : null}
            </>
          )}
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 18,
    padding: 20,
  },
  disabledCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  disabledMessage: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  disabledTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  emptyMessage: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  generalCount: {
    color: colors.textMuted,
    fontSize: 13,
  },
  generalEditor: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    padding: 16,
  },
  notFound: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  notFoundText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionDescription: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  settingsButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  settingsButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
});
