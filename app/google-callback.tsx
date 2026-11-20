import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import { completeGoogleSignIn } from '@/utils/google-auth';
import { syncNow } from '@/utils/sync-engine';

export default function GoogleCallbackRoute() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    completeGoogleSignIn()
      .then((returnPath) => {
        void syncNow().catch(() => undefined);
        if (active) {
          router.replace(returnPath ?? '/settings');
        }
      })
      .catch((callbackError) => {
        if (active) {
          setError(callbackError instanceof Error ? callbackError.message : 'Sign-in failed.');
        }
      });

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Text selectable style={styles.title}>
        {error ? 'Google sign-in failed' : 'Signing in to Google…'}
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
