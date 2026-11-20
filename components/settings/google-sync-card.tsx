import { Cloud, LogOut, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useSyncStore } from '@/store/sync-store';
import { colors } from '@/theme/colors';
import {
  getGoogleAccount,
  getGoogleClientId,
  isGoogleSyncSupported,
  signOutOfGoogle,
  startGoogleSignIn,
} from '@/utils/google-auth';
import { syncNow } from '@/utils/sync-engine';

export function GoogleSyncCard() {
  const showDialog = useAppDialog();
  const status = useSyncStore((state) => state.status);
  const error = useSyncStore((state) => state.error);
  const base = useSyncStore((state) => state.base);
  const [account, setAccount] = useState(getGoogleAccount);
  const supported = isGoogleSyncSupported();
  const configured = Boolean(getGoogleClientId());
  const syncing = status === 'syncing';

  async function signIn() {
    try {
      await startGoogleSignIn();
    } catch (signInError) {
      showDialog('Could not sign in', getMessage(signInError));
    }
  }

  function signOut() {
    signOutOfGoogle();
    useSyncStore.getState().setBase(undefined);
    setAccount(undefined);
  }

  async function syncAgain() {
    try {
      await syncNow();
    } catch (syncError) {
      showDialog('Could not sync', getMessage(syncError));
    }
    setAccount(getGoogleAccount());
  }

  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text selectable style={styles.title}>
          Google sync
        </Text>
        <Text selectable style={styles.description}>
          Sign in with Google to keep your games, friends, scripts and notes in step across your
          devices. The copy lives in a hidden folder of your own Google Drive.
        </Text>
      </View>

      {!supported ? (
        <Text selectable style={styles.description}>
          Google sync is available in the web app for now. Use Data transfer on this device.
        </Text>
      ) : !configured ? (
        <Text selectable style={styles.description}>
          Google sync is not configured for this app yet.
        </Text>
      ) : account ? (
        <>
          <Text selectable style={styles.account}>
            {account.email ?? 'Signed in to Google'}
          </Text>
          <Text selectable style={error ? styles.error : styles.description}>
            {syncing
              ? 'Syncing…'
              : error
                ? error
                : base
                  ? `Last synced ${new Date(base.syncedAt).toLocaleString()}`
                  : 'Not synced yet'}
          </Text>
          <Button disabled={syncing} icon={RefreshCw} label="Sync now" onPress={syncAgain} />
          <Button icon={LogOut} label="Sign out" onPress={signOut} secondary />
        </>
      ) : (
        <Button icon={Cloud} label="Sign in with Google" onPress={signIn} />
      )}
    </View>
  );
}

type ButtonProps = {
  disabled?: boolean;
  icon: typeof Cloud;
  label: string;
  onPress: () => void;
  secondary?: boolean;
};

function Button({ disabled, icon: Icon, label, onPress, secondary }: ButtonProps) {
  const color = disabled ? colors.onDisabled : secondary ? colors.text : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        disabled && styles.actionDisabled,
        pressed && styles.actionPressed,
      ]}
    >
      <Icon color={color} size={18} strokeWidth={2.6} />
      <Text
        style={[
          styles.actionText,
          secondary && styles.actionTextSecondary,
          disabled && styles.actionTextDisabled,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  account: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  action: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderCurve: 'continuous',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  actionDisabled: {
    backgroundColor: colors.disabled,
  },
  actionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actionSecondary: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderWidth: 1,
  },
  actionText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  actionTextDisabled: {
    color: colors.onDisabled,
  },
  actionTextSecondary: {
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderCurve: 'continuous',
    borderRadius: 10,
    borderWidth: 1,
    gap: 16,
    padding: 16,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    lineHeight: 21,
  },
  heading: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
});
