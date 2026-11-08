import { ImagePlus, Link2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { FriendAvatar } from '@/components/friends/friend-avatar';
import { Text, TextInput } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Friend } from '@/types/game';
import {
  fetchSocialPicture,
  getFriendPicture,
  getSocialPictureSource,
  parsePictureUrl,
  pickPictureFile,
} from '@/utils/friend-picture-utils';

const AVATAR_SIZE = 72;

type FriendPictureCardProps = {
  friend: Friend;
};

/** Profile picture of a friend: fetched from a social link, or chosen by hand to override it. */
export function FriendPictureCard({ friend }: FriendPictureCardProps) {
  const updateFriendPicture = useGameStore((state) => state.updateFriendPicture);
  const [editing, setEditing] = useState(false);
  const [link, setLink] = useState(friend.socialLink ?? '');
  const [pictureUrl, setPictureUrl] = useState('');
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);
  const picture = getFriendPicture(friend);
  const source = getSocialPictureSource(link);
  const typedPictureUrl = parsePictureUrl(pictureUrl);

  async function handleFetch() {
    if (!source) {
      return;
    }
    setBusy(true);
    setStatus(`Fetching from ${source.label}…`);
    try {
      const socialPicture = await fetchSocialPicture(source);
      updateFriendPicture(friend, { socialLink: link.trim(), socialPicture });
      setStatus(
        friend.picture
          ? `Fetched from ${source.label}. Your own picture still shows; remove it to use this one.`
          : `Fetched from ${source.label}.`,
      );
    } catch (error) {
      updateFriendPicture(friend, { socialLink: link.trim(), socialPicture: undefined });
      setStatus(error instanceof Error ? error.message : 'Could not fetch a picture.');
    } finally {
      setBusy(false);
    }
  }

  async function handleChooseImage() {
    setBusy(true);
    try {
      const chosen = await pickPictureFile();
      if (chosen) {
        updateFriendPicture(friend, { picture: chosen });
        setStatus('Using your picture.');
      }
    } catch {
      setStatus('Could not read that image.');
    } finally {
      setBusy(false);
    }
  }

  function handleUsePictureUrl() {
    if (!typedPictureUrl) {
      return;
    }
    updateFriendPicture(friend, { picture: typedPictureUrl });
    setPictureUrl('');
    setStatus('Using that image link.');
  }

  function handleRemove() {
    if (friend.picture) {
      updateFriendPicture(friend, { picture: undefined });
      setStatus(friend.socialPicture ? 'Back to the fetched picture.' : 'Picture removed.');
      return;
    }
    updateFriendPicture(friend, { socialPicture: undefined });
    setStatus('Picture removed.');
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FriendAvatar name={friend.name} picture={picture} size={AVATAR_SIZE} />
        <View style={styles.headerText}>
          <Text selectable style={styles.title}>
            Profile picture
          </Text>
          <Text selectable style={styles.subtitle}>
            {friend.picture
              ? 'Chosen by you'
              : friend.socialPicture
                ? `From ${getSocialPictureSource(friend.socialLink ?? '')?.label ?? 'a social link'}`
                : 'None yet'}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={editing ? 'Close picture settings' : 'Change profile picture'}
          accessibilityRole="button"
          onPress={() => setEditing((current) => !current)}
          style={({ pressed }) => [styles.smallButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.smallButtonText}>{editing ? 'Done' : 'Change'}</Text>
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.form}>
          <Text style={styles.label}>Social link</Text>
          <View style={styles.row}>
            <TextInput
              accessibilityLabel="Social link"
              autoCapitalize="none"
              autoCorrect={false}
              enterKeyHint="go"
              onChangeText={setLink}
              onSubmitEditing={handleFetch}
              placeholder="facebook.com/name, WhatsApp number, email…"
              placeholderTextColor={colors.textSubtle}
              returnKeyType="go"
              submitBehavior="submit"
              style={styles.input}
              value={link}
            />
            <Pressable
              accessibilityLabel="Fetch picture from social link"
              accessibilityRole="button"
              accessibilityState={{ disabled: !source || busy }}
              disabled={!source || busy}
              onPress={handleFetch}
              style={({ pressed }) => [
                styles.actionButton,
                !source || busy ? styles.actionButtonDisabled : pressed && styles.buttonPressed,
              ]}
            >
              <Link2
                color={source && !busy ? colors.onPrimary : colors.onDisabled}
                size={18}
                strokeWidth={2.6}
              />
              <Text style={[styles.actionText, (!source || busy) && styles.actionTextDisabled]}>
                Fetch
              </Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {link.trim() && !source
              ? 'Not a link this app can read. Try Facebook, Instagram, X, Telegram, TikTok, WhatsApp number or email.'
              : source
                ? `Looks like ${source.label}.`
                : 'Works with Facebook, Instagram, X, Telegram, TikTok, YouTube, GitHub, a WhatsApp number or an email (Gravatar).'}
          </Text>

          <Text style={styles.label}>Or use your own picture</Text>
          <View style={styles.row}>
            <TextInput
              accessibilityLabel="Image link"
              autoCapitalize="none"
              autoCorrect={false}
              enterKeyHint="done"
              onChangeText={setPictureUrl}
              onSubmitEditing={handleUsePictureUrl}
              placeholder="Image link (https://…)"
              placeholderTextColor={colors.textSubtle}
              returnKeyType="done"
              submitBehavior="submit"
              style={styles.input}
              value={pictureUrl}
            />
            <Pressable
              accessibilityLabel="Use image link"
              accessibilityRole="button"
              accessibilityState={{ disabled: !typedPictureUrl }}
              disabled={!typedPictureUrl}
              onPress={handleUsePictureUrl}
              style={({ pressed }) => [
                styles.actionButton,
                !typedPictureUrl ? styles.actionButtonDisabled : pressed && styles.buttonPressed,
              ]}
            >
              <Text style={[styles.actionText, !typedPictureUrl && styles.actionTextDisabled]}>
                Use
              </Text>
            </Pressable>
          </View>
          <View style={styles.row}>
            <Pressable
              accessibilityLabel="Choose an image"
              accessibilityRole="button"
              disabled={busy}
              onPress={handleChooseImage}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <ImagePlus color={colors.text} size={18} strokeWidth={2.4} />
              <Text style={styles.secondaryText}>Choose image</Text>
            </Pressable>
            {picture ? (
              <Pressable
                accessibilityLabel={friend.picture ? 'Remove your picture' : 'Remove picture'}
                accessibilityRole="button"
                onPress={handleRemove}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              >
                <Trash2 color={colors.danger} size={18} strokeWidth={2.4} />
                <Text style={styles.dangerText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>

          {status ? (
            <Text selectable style={styles.status}>
              {status}
            </Text>
          ) : null}
          <Text
            accessibilityRole="link"
            onPress={() => Linking.openURL('https://unavatar.io')}
            style={styles.credit}
          >
            Social pictures by unavatar.io
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  actionText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  actionTextDisabled: {
    color: colors.onDisabled,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  credit: {
    color: colors.textSubtle,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  dangerText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  form: {
    gap: 8,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    fontSize: 16,
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  secondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  smallButton: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  smallButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  status: {
    color: colors.text,
    fontSize: 14,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
});
