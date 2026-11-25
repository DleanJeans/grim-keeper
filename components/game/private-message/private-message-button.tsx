import { Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrivateMessageDialog } from '@/components/game/private-message/private-message-dialog';
import { Text } from '@/components/text';
import { usePrivateMessageStore } from '@/store/private-message-store';
import { colors } from '@/theme/colors';

/** Map toolbar button that opens the private message screen; the badge counts saved messages. */
export function PrivateMessageButton() {
  const [open, setOpen] = useState(false);
  const savedCount = usePrivateMessageStore((state) => state.saved.length);

  return (
    <>
      <Pressable
        accessibilityHint="Write a message and show it privately to a player"
        accessibilityLabel="Private message"
        accessibilityRole="button"
        hitSlop={6}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Mail color={colors.gameText} size={18} strokeWidth={2.4} />
        {savedCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{savedCount}</Text>
          </View>
        ) : null}
      </Pressable>
      {open ? <PrivateMessageDialog onClose={() => setOpen(false)} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -4,
    top: -4,
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: '900', lineHeight: 12 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
});
