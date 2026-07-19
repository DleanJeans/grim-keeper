import { Check, UserRoundSearch, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';

type BigWigPlayerPickerProps = {
  bigWig: Role;
  onSelect: (playerId?: string) => void;
  players: Player[];
  selectedPlayer?: Player;
};

export function BigWigPlayerPicker({
  bigWig,
  onSelect,
  players,
  selectedPlayer,
}: BigWigPlayerPickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(playerId?: string) {
    onSelect(playerId);
    setOpen(false);
  }

  return (
    <>
      <RoleReference
        accessibilityLabel={
          selectedPlayer ? `Big Wig: ${selectedPlayer.name}` : 'Select a player as Big Wig'
        }
        containerStyle={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        onPress={() => setOpen(true)}
        role={bigWig}
        textStyle={styles.triggerText}
      >
        <Text selectable style={styles.selectionText}>
          {selectedPlayer?.name ?? 'Select player'}
        </Text>
      </RoleReference>
      <Modal animationType="slide" onRequestClose={() => setOpen(false)} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close Big Wig player picker"
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={styles.dismissArea}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <RoleReference role={bigWig} textStyle={styles.title} />
              <Pressable
                accessibilityLabel="Close Big Wig player picker"
                accessibilityRole="button"
                onPress={() => setOpen(false)}
                style={styles.closeButton}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <Text selectable style={styles.description}>
              Choose the player who will speak for the nominee.
            </Text>
            <ScrollView contentContainerStyle={styles.playerList}>
              {players.map((player) => {
                const selected = player.id === selectedPlayer?.id;
                return (
                  <Pressable
                    accessibilityRole="button"
                    key={player.id}
                    onPress={() => handleSelect(player.id)}
                    style={({ pressed }) => [
                      styles.playerOption,
                      selected && styles.playerOptionSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <PlayerNameWithRole player={player} textStyle={styles.playerName} />
                    {selected ? <Check color={colors.primary} size={18} strokeWidth={3} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            {selectedPlayer ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => handleSelect(undefined)}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                <Text style={styles.clearText}>Clear selection</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: '#00000099', flex: 1, justifyContent: 'flex-end' },
  clearButton: { alignItems: 'center', paddingVertical: 10 },
  clearText: { color: colors.danger, fontWeight: '800' },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  dismissArea: { flex: 1 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  playerList: { gap: 8 },
  playerName: { color: colors.text, fontSize: 15, fontWeight: '800' },
  playerOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  playerOptionSelected: { borderColor: colors.primary },
  pressed: { backgroundColor: colors.surfacePressed },
  selectionText: { color: colors.textMuted, fontSize: 12 },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    maxHeight: '82%',
    padding: 16,
  },
  title: { color: colors.text, fontSize: 18, fontWeight: '900' },
  trigger: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  triggerText: { color: colors.text, fontSize: 13, fontWeight: '800' },
});
