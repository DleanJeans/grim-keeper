import { Music2, RefreshCw } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DjSongRow } from '@/components/dj/dj-song-row';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import {
  getCurrentlyPlayingSpotifySong,
  SpotifyError,
  startSpotifyAuthorization,
} from '@/utils/spotify';

type DjCurrentSongProps = {
  gameId: string;
};

const REFRESH_INTERVAL_MS = 15_000;

export function DjCurrentSong({ gameId }: DjCurrentSongProps) {
  const [songUrl, setSongUrl] = useState<string>();
  const [error, setError] = useState<SpotifyError | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (process.env.EXPO_OS !== 'web') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setSongUrl(await getCurrentlyPlayingSpotifySong());
    } catch (nextError) {
      setSongUrl(undefined);
      setError(
        nextError instanceof SpotifyError
          ? nextError
          : new SpotifyError('device', 'Spotify could not read the current playback.'),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function reconnectSpotify() {
    try {
      await startSpotifyAuthorization();
    } catch (nextError) {
      setError(
        nextError instanceof SpotifyError
          ? nextError
          : new SpotifyError('configuration', 'Spotify authorization could not be started.'),
      );
    }
  }

  const canReconnect = error?.kind === 'unauthorized' || error?.kind === 'permission';

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Music2 color={colors.textMuted} size={17} strokeWidth={2.4} />
        <Text selectable style={styles.title}>
          Currently playing
        </Text>
        {process.env.EXPO_OS === 'web' ? (
          <Pressable
            accessibilityLabel="Refresh currently playing song"
            accessibilityRole="button"
            disabled={loading}
            onPress={() => void refresh()}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            <RefreshCw color={loading ? colors.onDisabled : colors.text} size={16} />
            <Text style={[styles.refreshText, loading && styles.refreshTextDisabled]}>Refresh</Text>
          </Pressable>
        ) : null}
      </View>
      {songUrl ? (
        <DjSongRow gameId={gameId} labels={['Currently playing']} songUrl={songUrl} />
      ) : error ? (
        <View style={styles.messageCard}>
          <Text selectable style={styles.message}>
            {error.message}
          </Text>
          {canReconnect ? (
            <Pressable
              accessibilityLabel="Reconnect Spotify"
              accessibilityRole="button"
              onPress={() => void reconnectSpotify()}
              style={({ pressed }) => [styles.reconnectButton, pressed && styles.pressed]}
            >
              <Text style={styles.reconnectText}>
                {error.kind === 'permission' ? 'Reconnect Spotify' : 'Connect Spotify'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <Text selectable style={styles.message}>
          {process.env.EXPO_OS !== 'web'
            ? 'Current Spotify playback is available in the web app.'
            : loading
              ? 'Checking Spotify…'
              : 'Spotify is not currently playing anything.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  messageCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 9,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  reconnectButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 7,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  reconnectText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  refreshButton: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  refreshText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  refreshTextDisabled: {
    color: colors.onDisabled,
  },
  section: {
    gap: 10,
  },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
  },
});
