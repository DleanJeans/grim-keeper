import * as Clipboard from 'expo-clipboard';
import { Link2 } from 'lucide-react-native';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Role, StoredScript } from '@/types/game';
import { createSharedGame, createShareGameUrl } from '@/utils/share-game-link';

type ShareGameLinkButtonProps = {
  game: Game;
  roleCatalog: Role[];
  scripts: StoredScript[];
};

export function ShareGameLinkButton({ game, roleCatalog, scripts }: ShareGameLinkButtonProps) {
  const showDialog = useAppDialog();
  const appUserName = useGameStore((state) => state.appUserName);

  async function handleShare() {
    let url: string;

    try {
      url = createShareGameUrl(createSharedGame(game, scripts, roleCatalog, appUserName));
    } catch (error) {
      showDialog('Could not share game', getErrorMessage(error));
      return;
    }

    if (process.env.EXPO_OS !== 'web') {
      await Share.share({ message: url }).catch(() => undefined);
      return;
    }

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Grim Keeper game', url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await Clipboard.setStringAsync(url);
      showDialog('Link copied', url);
    } catch {
      showDialog('Share link', url);
    }
  }

  return (
    <View style={styles.container}>
      <Text selectable style={styles.description}>
        Share a link that sets up this game for friends: the players, where they sit on the map, and
        the script. Claims, confirms and notes stay on this device.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share game link"
        onPress={handleShare}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Link2 color={colors.text} size={18} strokeWidth={2.6} />
        <Text style={styles.buttonText}>Share game link</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buttonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  buttonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  container: {
    gap: 10,
    paddingBottom: 4,
    paddingTop: 14,
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The share link could not be made.';
}
