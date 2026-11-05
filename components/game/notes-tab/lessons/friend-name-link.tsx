import { router } from 'expo-router';
import { Pressable, type StyleProp, StyleSheet, type TextStyle } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { getFriendByName } from '@/utils/friend-utils';

type FriendNameLinkProps = {
  name: string;
  style?: StyleProp<TextStyle>;
};

/** A player's name that opens their friend page; plain text when they aren't a friend yet. */
export function FriendNameLink({ name, style }: FriendNameLinkProps) {
  const friends = useGameStore((state) => state.friends);
  const friend = getFriendByName(friends, name);

  if (!friend) {
    return (
      <Text numberOfLines={1} style={style}>
        {name}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens this friend's details"
      accessibilityLabel={name}
      accessibilityRole="link"
      hitSlop={6}
      onPress={() => router.push({ pathname: '/friends/[id]', params: { id: friend.id } })}
      style={({ pressed }) => [styles.link, pressed && styles.pressed]}
    >
      <Text numberOfLines={1} style={[style, styles.underline]}>
        {name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: { flexShrink: 1 },
  pressed: { opacity: 0.6 },
  underline: { textDecorationLine: 'underline' },
});
