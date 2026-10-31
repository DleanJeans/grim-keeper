import { Plus, Search } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import {
  getSpotifyClientId,
  SpotifyError,
  type SpotifySearchResult,
  searchSpotifyTracks,
  startSpotifyAuthorization,
} from '@/utils/spotify';

/** Wait this long after the last keystroke before asking Spotify. */
const SEARCH_DELAY_MS = 350;
const MIN_QUERY_LENGTH = 2;

type SpotifySearchResultsProps = {
  onSelect: (songUrl: string) => void;
  query: string;
};

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { results: SpotifySearchResult[]; status: 'done' }
  | { error: SpotifyError; status: 'error' };

/**
 * Spotify songs matching what was typed into the song field, so a song can be added by name.
 * Web only, and only when the app has a Spotify client id.
 */
export function SpotifySearchResults({ onSelect, query }: SpotifySearchResultsProps) {
  const trimmedQuery = query.trim();
  const enabled =
    process.env.EXPO_OS === 'web' &&
    !!getSpotifyClientId() &&
    trimmedQuery.length >= MIN_QUERY_LENGTH;
  const [state, setState] = useState<SearchState>({ status: 'idle' });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();
    setState({ status: 'loading' });
    const timeout = setTimeout(() => {
      searchSpotifyTracks(trimmedQuery, controller.signal)
        .then((results) => setState({ results, status: 'done' }))
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            error:
              error instanceof SpotifyError
                ? error
                : new SpotifyError('device', 'Spotify search failed. Try again.'),
            status: 'error',
          });
        });
    }, SEARCH_DELAY_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [enabled, trimmedQuery]);

  if (!enabled || state.status === 'idle') {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Search color={colors.textMuted} size={14} strokeWidth={2.4} />
        <Text style={styles.headingText}>Spotify</Text>
      </View>
      {state.status === 'loading' ? (
        <Text style={styles.message}>Searching…</Text>
      ) : state.status === 'error' ? (
        <SearchError error={state.error} />
      ) : state.results.length === 0 ? (
        <Text style={styles.message}>No Spotify songs found.</Text>
      ) : (
        state.results.map((result) => (
          <SearchResultRow key={result.url} onSelect={onSelect} result={result} />
        ))
      )}
    </View>
  );
}

function SearchError({ error }: { error: SpotifyError }) {
  const [connectError, setConnectError] = useState<string>();
  const canConnect = error.kind === 'unauthorized';

  async function connect() {
    try {
      await startSpotifyAuthorization();
    } catch (nextError) {
      setConnectError(
        nextError instanceof SpotifyError
          ? nextError.message
          : 'Spotify authorization could not be started.',
      );
    }
  }

  return (
    <View style={styles.errorRow}>
      <Text style={styles.message}>{connectError ?? error.message}</Text>
      {canConnect ? (
        <Pressable
          accessibilityLabel="Connect Spotify to search"
          accessibilityRole="button"
          onPress={() => void connect()}
          style={({ pressed }) => [styles.connectButton, pressed && styles.pressed]}
        >
          <Text style={styles.connectText}>Connect Spotify</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function SearchResultRow({
  onSelect,
  result,
}: {
  onSelect: (songUrl: string) => void;
  result: SpotifySearchResult;
}) {
  return (
    <Pressable
      accessibilityLabel={`Add ${result.title}${result.artists ? ` by ${result.artists}` : ''}`}
      accessibilityRole="button"
      onPress={() => onSelect(result.url)}
      style={({ pressed }) => [styles.result, pressed && styles.resultPressed]}
    >
      {result.imageUrl ? (
        <Image source={{ uri: result.imageUrl }} style={styles.cover} />
      ) : (
        <View style={styles.cover} />
      )}
      <View style={styles.resultText}>
        <Text numberOfLines={1} style={styles.title}>
          {result.title}
        </Text>
        {result.artists ? (
          <Text numberOfLines={1} style={styles.artists}>
            {result.artists}
          </Text>
        ) : null}
      </View>
      <Plus color={colors.textMuted} size={18} strokeWidth={2.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  artists: {
    color: colors.textMuted,
    fontSize: 12,
  },
  connectButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 7,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 12,
  },
  connectText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 8,
    padding: 8,
  },
  cover: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 4,
    height: 40,
    width: 40,
  },
  errorRow: {
    gap: 8,
    padding: 4,
  },
  heading: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  headingText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  message: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    padding: 4,
  },
  pressed: {
    opacity: 0.7,
  },
  result: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 10,
    minHeight: 48,
    padding: 4,
  },
  resultPressed: {
    backgroundColor: colors.surfacePressed,
  },
  resultText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
});
