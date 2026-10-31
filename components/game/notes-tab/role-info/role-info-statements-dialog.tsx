import { Check } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  type TextInput as TextInputType,
  View,
} from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text, TextInput } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role, StartingNight } from '@/types/game';
import { getPhaseLabel } from '@/utils/game-phase-utils';
import { ROLE_INFO_TRUE_KEY, type RoleInfoSlot } from '@/utils/role-info-utils';

export type RoleInfoStatementsDialogProps = {
  /** Days that can be filled in, in order. */
  days: number[];
  /** Day and slot whose statement gets the keyboard first. */
  focusDay?: number;
  focusSlotId?: string;
  /** Mark one statement per day as possibly true. */
  markTrue: boolean;
  onClose: () => void;
  onSave: (valuesByDay: Map<number, Record<string, string>>) => void;
  role?: Role;
  slots: RoleInfoSlot[];
  startingNight: StartingNight;
  /** Stored values per day. */
  valuesByDay: Map<number, Record<string, string>>;
};

/**
 * Types every statement of a daily character (the Savant) at once, for each day so far.
 * Remount (via `key`) per opening so the drafts start from the stored values.
 */
export function RoleInfoStatementsDialog({
  days,
  focusDay,
  focusSlotId,
  markTrue,
  onClose,
  onSave,
  role,
  slots,
  startingNight,
  valuesByDay,
}: RoleInfoStatementsDialogProps) {
  const [drafts, setDrafts] = useState(
    () => new Map(days.map((day) => [day, { ...(valuesByDay.get(day) ?? {}) }])),
  );
  const scrollRef = useRef<ScrollView>(null);
  const inputRefs = useRef(new Map<string, TextInputType>());
  const didFocusRef = useRef(false);

  function updateDraft(day: number, key: string, value: string | undefined) {
    setDrafts((current) => {
      const { [key]: _previous, ...rest } = current.get(day) ?? {};
      return new Map(current).set(day, value === undefined ? rest : { ...rest, [key]: value });
    });
  }

  function handleSave() {
    onSave(
      new Map(
        days.map((day) => {
          const draft = drafts.get(day) ?? {};
          const values: Record<string, string> = {};
          for (const slot of slots) {
            const text = draft[slot.id]?.trim();
            if (text) values[slot.id] = text;
          }
          const trueSlotId = draft[ROLE_INFO_TRUE_KEY];
          if (trueSlotId && values[trueSlotId]) values[ROLE_INFO_TRUE_KEY] = trueSlotId;
          return [day, values];
        }),
      ),
    );
  }

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={role !== undefined}>
      <KeyboardAvoidingView
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View accessibilityRole="alert" style={styles.dialog}>
          <View style={styles.header}>
            {role ? <RoleIcon role={role} size={28} /> : null}
            <Text selectable style={styles.title}>
              {role?.name}
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={styles.days}
            keyboardShouldPersistTaps="handled"
            ref={scrollRef}
            style={styles.scroll}
          >
            {days.map((day) => (
              <View
                key={day}
                onLayout={(event) => {
                  // Bring the tapped day into view, then give its statement the keyboard.
                  if (day !== focusDay || didFocusRef.current) return;
                  didFocusRef.current = true;
                  scrollRef.current?.scrollTo({ animated: false, y: event.nativeEvent.layout.y });
                  inputRefs.current.get(`${day}-${focusSlotId}`)?.focus();
                }}
                style={styles.day}
              >
                {days.length > 1 ? (
                  <Text style={styles.dayLabel}>
                    {getPhaseLabel({ activeDay: day, activePhase: 'day' }, startingNight)}
                  </Text>
                ) : null}
                {slots.map((slot) => (
                  <StatementInput
                    inputRef={(input) => {
                      const key = `${day}-${slot.id}`;
                      if (input) inputRefs.current.set(key, input);
                      else inputRefs.current.delete(key);
                    }}
                    isFalse={isMarkedFalse(drafts.get(day), slot)}
                    isTrue={drafts.get(day)?.[ROLE_INFO_TRUE_KEY] === slot.id}
                    key={slot.id}
                    markTrue={markTrue}
                    onChangeText={(text) => updateDraft(day, slot.id, text)}
                    onToggleTrue={(isTrue) =>
                      updateDraft(day, ROLE_INFO_TRUE_KEY, isTrue ? slot.id : undefined)
                    }
                    slot={slot}
                    value={drafts.get(day)?.[slot.id] ?? ''}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              style={({ pressed }) => [
                styles.action,
                styles.successAction,
                pressed && styles.actionPressed,
              ]}
            >
              <Text style={[styles.actionText, styles.successActionText]}>Save</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
  },
  actionPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  day: {
    gap: 8,
  },
  dayLabel: {
    color: colors.noteDayHeader,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  days: {
    gap: 16,
  },
  dialog: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderCurve: 'continuous',
    borderRadius: 12,
    borderWidth: 1,
    boxShadow: '0 18px 48px rgba(0, 0, 0, 0.45)',
    gap: 16,
    maxHeight: '85%',
    maxWidth: 460,
    padding: 18,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputFalse: {
    borderColor: colors.danger,
  },
  inputTrue: {
    borderColor: colors.roleInfoTokenTrueBorder,
  },
  scroll: {
    flexGrow: 0,
  },
  statement: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  successAction: {
    backgroundColor: colors.successSurface,
    borderColor: colors.successBorder,
  },
  successActionText: {
    color: colors.successText,
  },
  title: {
    color: colors.text,
    flexShrink: 1,
    fontSize: 19,
    fontWeight: '900',
  },
  tickHidden: {
    opacity: 0,
  },
  trueToggle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    minHeight: 44,
    paddingHorizontal: 10,
  },
  trueToggleOn: {
    backgroundColor: colors.successSurface,
    borderColor: colors.roleInfoTokenTrueBorder,
  },
  trueToggleText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  trueToggleTextOn: {
    color: colors.successText,
  },
});

function StatementInput({
  inputRef,
  isFalse,
  isTrue,
  markTrue,
  onChangeText,
  onToggleTrue,
  slot,
  value,
}: {
  inputRef: (input: TextInputType | null) => void;
  /** Another statement of the day is marked true, so this one is false. */
  isFalse: boolean;
  isTrue: boolean;
  markTrue: boolean;
  onChangeText: (text: string) => void;
  onToggleTrue: (isTrue: boolean) => void;
  slot: RoleInfoSlot;
  value: string;
}) {
  return (
    <View style={styles.statement}>
      <TextInput
        accessibilityLabel={slot.label}
        multiline
        onChangeText={onChangeText}
        placeholder={slot.label}
        placeholderTextColor={colors.inputPlaceholder}
        ref={inputRef}
        style={[styles.input, isTrue && styles.inputTrue, isFalse && styles.inputFalse]}
        value={value}
      />
      {markTrue ? (
        <Pressable
          accessibilityLabel={`${slot.label} might be true`}
          accessibilityRole="switch"
          accessibilityState={{ checked: isTrue }}
          onPress={() => onToggleTrue(!isTrue)}
          style={[styles.trueToggle, isTrue && styles.trueToggleOn]}
        >
          {/* The tick keeps its space when hidden, so toggling never resizes the button. */}
          <View style={!isTrue && styles.tickHidden}>
            <Check color={colors.successText} size={14} strokeWidth={3} />
          </View>
          <Text style={[styles.trueToggleText, isTrue && styles.trueToggleTextOn]}>True?</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function isMarkedFalse(draft: Record<string, string> | undefined, slot: RoleInfoSlot) {
  const trueSlotId = draft?.[ROLE_INFO_TRUE_KEY];
  return trueSlotId !== undefined && trueSlotId !== slot.id;
}
