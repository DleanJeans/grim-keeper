import { Image, StyleSheet, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type FriendAvatarProps = {
  name: string;
  picture?: string;
  size: number;
};

/** A friend's round profile picture, or the first letter of their name when there is none. */
export function FriendAvatar({ name, picture, size }: FriendAvatarProps) {
  const sizeStyle = { borderRadius: size / 2, height: size, width: size };

  if (picture) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="cover"
        source={{ uri: picture }}
        style={[styles.avatar, sizeStyle]}
      />
    );
  }

  return (
    <View style={[styles.avatar, styles.placeholder, sizeStyle]}>
      <Text style={[styles.initial, { fontSize: size * 0.45 }]}>{getInitial(name)}</Text>
    </View>
  );
}

function getInitial(name: string) {
  return Array.from(name.trim())[0]?.toLocaleUpperCase() ?? '';
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    overflow: 'hidden',
  },
  initial: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
