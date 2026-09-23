import { Music2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import {
  consumeSpotifyQueueResult,
  getSpotifyErrorMessage,
  parseSpotifySong,
  queueSpotifySong,
  SpotifyError,
  startSpotifyAuthorization,
} from '@/utils/spotify';

type SpotifyQueueButtonProps = {
  songUrl: string;
};

export function SpotifyQueueButton({ songUrl }: SpotifyQueueButtonProps) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const result = consumeSpotifyQueueResult(songUrl);
    if (result) {
      setStatus(result.message);
    }
  }, [songUrl]);

  if (Platform.OS !== 'web' || !parseSpotifySong(songUrl)) {
    return null;
  }

  async function handlePress() {
    try {
      setStatus('Adding…');
      await queueSpotifySong(songUrl);
      setStatus('Queued');
    } catch (error) {
      if (error instanceof SpotifyError && error.kind === 'unauthorized') {
        try {
          setStatus('Opening Spotify…');
          await startSpotifyAuthorization(songUrl);
          return;
        } catch (authorizationError) {
          setStatus(getSpotifyErrorMessage(authorizationError));
          return;
        }
      }

      setStatus(getSpotifyErrorMessage(error));
    }
  }

  return (
    <Pressable
      accessibilityLabel="Queue in Spotify"
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Music2 color={colors.text} size={16} strokeWidth={2.4} />
      <Text style={styles.label}>{status ?? 'Spotify queue'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.borderStrong,
    borderRadius: 7,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
});
