import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { BluffToken } from '@/components/game/notes-tab/role-info/bluff-token';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

type BluffsShowDialogProps = {
  bluffs: Role[];
  onClose: () => void;
  visible: boolean;
};

/** Storyteller mode: the bluffs on one screen; tapping one flashes "You are …" for a player. */
export function BluffsShowDialog({ bluffs, onClose, visible }: BluffsShowDialogProps) {
  const [revealed, setRevealed] = useState<Role | null>(null);

  function close() {
    setRevealed(null);
    onClose();
  }

  return (
    <ScaledModal animationType="fade" onRequestClose={close} visible={visible}>
      {revealed ? (
        <Pressable
          accessibilityHint="Goes back to the bluffs"
          accessibilityRole="button"
          onPress={() => setRevealed(null)}
          style={styles.reveal}
        >
          <Text style={styles.hint}>You are the</Text>
          <BluffToken role={revealed} selected size="large" />
          <Text style={styles.revealName}>{revealed.name}</Text>
          <Text style={styles.hint}>Tap anywhere to go back</Text>
        </Pressable>
      ) : (
        <View style={styles.screen}>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={close}
            style={styles.closeButton}
          >
            <X color={colors.textMuted} size={20} strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.hint}>Show this screen to the evil team</Text>
          <Text style={styles.heading}>These are your bluffs</Text>
          <View style={styles.list}>
            {bluffs.length === 0 ? (
              <Text style={styles.hint}>Fill in the Bluffs row first.</Text>
            ) : (
              bluffs.map((bluff) => (
                <Pressable
                  accessibilityRole="button"
                  key={bluff.id}
                  onPress={() => setRevealed(bluff)}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <BluffToken role={bluff} size="medium" />
                  <View style={styles.cardText}>
                    <Text style={styles.cardName}>{bluff.name}</Text>
                    <Text style={styles.cardMeta}>Not in play</Text>
                  </View>
                </Pressable>
              ))
            )}
          </View>
          <Text style={styles.hint}>Tap a bluff to tell a player “You are…”</Text>
        </View>
      )}
    </ScaledModal>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1, gap: 12, padding: 18 },
  closeButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    borderColor: colors.borderStrong,
    borderRadius: 17,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  heading: { color: colors.danger, fontSize: 28, fontWeight: '900', textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  list: { gap: 12, marginVertical: 12 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  cardPressed: { backgroundColor: colors.surfacePressed },
  cardText: { flex: 1 },
  cardName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  cardMeta: { color: colors.textMuted, fontSize: 12 },
  reveal: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    gap: 14,
    justifyContent: 'center',
    padding: 18,
  },
  revealName: { color: colors.text, fontSize: 34, fontWeight: '900' },
});
