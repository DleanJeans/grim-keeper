import { Copy, Ellipsis, Ticket, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { ScaledModal } from '@/components/scaled-modal';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

type ScriptCardMoreMenuProps = {
  oneTime: boolean;
  scriptName: string;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleOneTime: () => void;
};

/** The ⋯ button on a downloaded script card and the sheet with its less used actions. */
export function ScriptCardMoreMenu({
  oneTime,
  onDelete,
  onDuplicate,
  onToggleOneTime,
  scriptName,
}: ScriptCardMoreMenuProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const runAndClose = (action: () => void) => () => {
    close();
    action();
  };

  return (
    <>
      <Pressable
        accessibilityHint="Shows One-time, Duplicate and Delete"
        accessibilityLabel="More actions"
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.moreButton, pressed && styles.moreButtonPressed]}
      >
        <Ellipsis color={colors.textMuted} size={18} strokeWidth={2.6} />
      </Pressable>
      <ScaledModal animationType="fade" onRequestClose={close} transparent visible={open}>
        <View style={styles.backdrop}>
          <Pressable
            accessibilityLabel="Close menu"
            accessibilityRole="button"
            onPress={close}
            style={styles.backdropDismiss}
          />
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text numberOfLines={1} style={styles.title}>
                {scriptName}
              </Text>
              <Pressable
                accessibilityLabel="Close menu"
                accessibilityRole="button"
                hitSlop={8}
                onPress={close}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closePressed]}
              >
                <X color={colors.textMuted} size={18} strokeWidth={2.5} />
              </Pressable>
            </View>
            <Pressable
              accessibilityLabel="One-time script"
              accessibilityRole="switch"
              accessibilityState={{ checked: oneTime }}
              onPress={onToggleOneTime}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Ticket color={colors.textMuted} size={18} strokeWidth={2.4} />
              <View style={styles.itemText}>
                <Text style={styles.itemLabel}>One-time</Text>
                <Text style={styles.itemHint}>Leaves this list once a game uses it.</Text>
              </View>
              <Switch
                accessibilityLabel="One-time script"
                onValueChange={onToggleOneTime}
                thumbColor={oneTime ? colors.primary : colors.onDisabled}
                trackColor={{ false: colors.disabled, true: colors.borderStrong }}
                value={oneTime}
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={runAndClose(onDuplicate)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Copy color={colors.textMuted} size={18} strokeWidth={2.4} />
              <Text style={styles.itemLabel}>Duplicate</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={runAndClose(onDelete)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <Trash2 color={colors.danger} size={18} strokeWidth={2.4} />
              <Text style={[styles.itemLabel, styles.dangerLabel]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </ScaledModal>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop, flex: 1, justifyContent: 'flex-end' },
  backdropDismiss: { flex: 1 },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closePressed: { backgroundColor: colors.surfacePressed },
  dangerLabel: { color: colors.danger },
  header: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingBottom: 4 },
  item: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  itemHint: { color: colors.textMuted, fontSize: 12 },
  itemLabel: { color: colors.text, fontSize: 15, fontWeight: '700' },
  itemPressed: { backgroundColor: colors.surfacePressed },
  itemText: { flex: 1, gap: 2 },
  moreButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moreButtonPressed: { backgroundColor: colors.surfacePressed },
  sheet: {
    alignSelf: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
    maxWidth: 520,
    padding: 16,
    width: '100%',
  },
  title: { color: colors.text, flex: 1, fontSize: 18, fontWeight: '900' },
});
