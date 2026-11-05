import { History } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { PastEvilTeamsSheet } from '@/components/game/notes-tab/role-info/past-evil-teams-sheet';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game } from '@/types/game';

/** Opens the evil teams of the earlier games on this game's script. */
export function PastEvilTeamsButton({ game }: { game: Game }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        accessibilityHint="Shows the Demons, Minions and bluffs of earlier games on this script"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <History color={colors.textMuted} size={15} strokeWidth={2.5} />
        <Text style={styles.label}>Past evil teams</Text>
      </Pressable>
      <PastEvilTeamsSheet game={game} onClose={() => setOpen(false)} visible={open} />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  pressed: { backgroundColor: colors.surfacePressed },
});
