import { X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BluffToken } from '@/components/game/notes-tab/role-info/bluff-token';
import { HoldToReveal } from '@/components/hold-to-reveal';
import { ScaledModal } from '@/components/scaled-modal';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

export type BluffsPassMember = { id: string; kind: 'demon' | 'minion'; name: string };

type BluffsPassDialogProps = {
  /** The good characters the Demon is bluffing, in slot order. */
  bluffs: Role[];
  members: BluffsPassMember[];
  onClose: () => void;
  visible: boolean;
};

/**
 * The Demon hands the device to each evil player in turn: assign a bluff to everyone, then a
 * cover screen with the player's name, and the bluff only shows while the button is held.
 */
export function BluffsPassDialog({ bluffs, members, onClose, visible }: BluffsPassDialogProps) {
  const [assigned, setAssigned] = useState<Record<string, number>>({});
  const [turn, setTurn] = useState<number | null>(null);
  const [peeking, setPeeking] = useState(false);

  const bluffIndexOf = (memberIndex: number) =>
    assigned[members[memberIndex].id] ?? memberIndex % Math.max(bluffs.length, 1);

  const member = turn === null ? undefined : members[turn];
  const bluff = turn === null ? undefined : bluffs[bluffIndexOf(turn)];
  const otherBluffs = useMemo(
    () => bluffs.filter((candidate) => candidate !== bluff),
    [bluff, bluffs],
  );

  function close() {
    setTurn(null);
    setPeeking(false);
    onClose();
  }

  function next() {
    setPeeking(false);
    setTurn(turn !== null && turn + 1 < members.length ? turn + 1 : null);
  }

  return (
    <ScaledModal animationType="fade" onRequestClose={close} visible={visible}>
      <View style={styles.screen}>
        {turn === null || !member ? (
          <>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={close}
              style={styles.closeButton}
            >
              <X color={colors.textMuted} size={20} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.heading}>Pass bluffs to your team</Text>
            <Text style={styles.hint}>Pick which bluff each evil player should claim</Text>
            {members.length === 0 || bluffs.length === 0 ? (
              <Text style={styles.empty}>
                {bluffs.length === 0
                  ? 'Fill in the Bluffs row first.'
                  : 'Confirm a Demon or Minion on a player, or set a fake evil team, first.'}
              </Text>
            ) : (
              <ScrollView contentContainerStyle={styles.list}>
                {members.map((candidate, memberIndex) => (
                  <View key={candidate.id} style={styles.memberRow}>
                    <View style={styles.memberText}>
                      <Text style={styles.memberName}>{candidate.name}</Text>
                      <Text style={styles.memberKind}>
                        {candidate.kind === 'demon' ? 'Demon' : 'Minion'}
                      </Text>
                    </View>
                    {bluffs.map((option, optionIndex) => (
                      <BluffToken
                        accessibilityLabel={`${candidate.name} claims ${option.name}`}
                        key={option.id}
                        onPress={() =>
                          setAssigned((current) => ({ ...current, [candidate.id]: optionIndex }))
                        }
                        role={option}
                        selected={bluffIndexOf(memberIndex) === optionIndex}
                        size="small"
                      />
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
            {members.length > 0 && bluffs.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setTurn(0)}
                style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}
              >
                <Text style={styles.primaryText}>Hand to {members[0].name} →</Text>
              </Pressable>
            ) : null}
          </>
        ) : peeking && bluff ? (
          <View style={styles.center}>
            <Text style={styles.hint}>{member.name}, you are claiming</Text>
            <BluffToken role={bluff} selected size="large" />
            <Text style={styles.bluffName}>{bluff.name}</Text>
            {otherBluffs.length > 0 ? (
              <Text style={styles.hint}>
                Other bluffs: {otherBluffs.map((other) => other.name).join(' · ')}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={styles.hint}>Hand the device to</Text>
            <Text style={styles.memberTitle}>{member.name}</Text>
            <HoldToReveal
              onHoldChange={setPeeking}
              style={({ pressed }) => [
                styles.primary,
                styles.hold,
                pressed && styles.primaryPressed,
              ]}
            >
              <Text style={styles.primaryText}>Hold to see your bluff</Text>
            </HoldToReveal>
            <Text style={styles.hint}>Letting go hides it again.</Text>
            <Pressable
              accessibilityRole="button"
              onPress={next}
              style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}
            >
              <Text style={styles.secondaryText}>
                {turn + 1 < members.length ? `Next → ${members[turn + 1].name}` : 'Done'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
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
  heading: { color: colors.danger, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  empty: { color: colors.textMuted, fontSize: 14, marginTop: 20, textAlign: 'center' },
  list: { gap: 10, paddingVertical: 8 },
  memberRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  memberText: { flex: 1 },
  memberName: { color: colors.text, fontSize: 17, fontWeight: '800' },
  memberKind: { color: colors.textMuted, fontSize: 12 },
  memberTitle: { color: colors.text, fontSize: 34, fontWeight: '900', textAlign: 'center' },
  center: { alignItems: 'center', flex: 1, gap: 14, justifyContent: 'center' },
  bluffName: { color: colors.text, fontSize: 30, fontWeight: '900' },
  primary: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryPressed: { opacity: 0.85 },
  primaryText: { color: colors.onPrimary, fontSize: 15, fontWeight: '800' },
  hold: { minHeight: 64 },
  secondary: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 48,
  },
  secondaryPressed: { backgroundColor: colors.surfacePressed },
  secondaryText: { color: colors.text, fontSize: 15, fontWeight: '800' },
});
