import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { completeSpotifyAuthorization, getSpotifyErrorMessage } from '@/utils/spotify';

export default function DjCallbackRoute() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    completeSpotifyAuthorization()
      .then((returnPath) => {
        if (active) {
          router.replace(returnPath ?? '/');
        }
      })
      .catch((callbackError) => {
        if (active) {
          setError(getSpotifyErrorMessage(callbackError));
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Text selectable style={styles.title}>
        {error ? 'Spotify connection failed' : 'Connecting to Spotify…'}
      </Text>
      {error ? <Text style={styles.message}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
});
