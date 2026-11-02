import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';

const SLOT_SIZE = 44;
const SLOT_BORDER_WIDTH = 2;

type ClaimSlotsProps = {
  /** Slot that the next role tapped in the picker goes into; `slotCount` means the + button. */
  activeSlot: number;
  /** Claimed roles in slot order. */
  roles: Role[];
  /** Slots shown, filled or empty; at least `roles.length`. */
  slotCount: number;
  /** Shows a + button after the slots, for one more empty slot. */
  canAddSlot: boolean;
  onAddSlot: () => void;
  onPressSlot: (slotIndex: number) => void;
};

/** One slot per claimed character, empty slots to fill, and a + button for more. */
export function ClaimSlots({
  activeSlot,
  canAddSlot,
  onAddSlot,
  onPressSlot,
  roles,
  slotCount,
}: ClaimSlotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: slotCount }, (_, index) => (
        <ClaimSlot
          active={index === activeSlot}
          index={index}
          // biome-ignore lint/suspicious/noArrayIndexKey: slots are positions, not items.
          key={index}
          onPress={onPressSlot}
          role={roles[index]}
        />
      ))}
      {canAddSlot ? (
        <Pressable
          accessibilityLabel="Add another claim slot"
          accessibilityRole="button"
          onPress={onAddSlot}
          style={({ pressed }) => [
            styles.slot,
            styles.addSlot,
            activeSlot === slotCount && styles.activeSlot,
            pressed && styles.pressed,
          ]}
        >
          <Plus
            color={activeSlot === slotCount ? colors.roleClaim : colors.textMuted}
            size={20}
            strokeWidth={2.5}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  activeSlot: {
    borderColor: colors.roleClaim,
    borderStyle: 'solid',
  },
  addSlot: {
    borderColor: colors.borderStrong,
    borderStyle: 'solid',
  },
  emptySlot: {
    borderColor: colors.roleInfoTokenEmptyBorder,
    borderStyle: 'dashed',
  },
  filledSlot: {
    borderColor: colors.roleInfoTokenFilledBorder,
  },
  item: {
    alignItems: 'center',
    gap: 3,
    width: SLOT_SIZE + 16,
  },
  name: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeName: {
    color: colors.roleClaim,
  },
  pressed: {
    backgroundColor: colors.surfacePressed,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  slot: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderRadius: SLOT_SIZE / 2,
    borderWidth: SLOT_BORDER_WIDTH,
    height: SLOT_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: SLOT_SIZE,
  },
});

function ClaimSlot({
  active,
  index,
  onPress,
  role,
}: {
  active: boolean;
  index: number;
  onPress: (slotIndex: number) => void;
  role?: Role;
}) {
  const label = role
    ? `Claim ${index + 1}: ${role.name}${active ? ', tap to clear' : ''}`
    : `Claim ${index + 1}: empty`;

  return (
    <View style={styles.item}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        onPress={() => onPress(index)}
        style={({ pressed }) => [
          styles.slot,
          role ? styles.filledSlot : styles.emptySlot,
          active && styles.activeSlot,
          pressed && styles.pressed,
        ]}
      >
        {role ? (
          <RoleIcon role={role} scale={1.25} size={SLOT_SIZE - SLOT_BORDER_WIDTH * 2} />
        ) : null}
      </Pressable>
      <Text numberOfLines={1} style={[styles.name, active && styles.activeName]}>
        {role ? role.name : active ? 'Next' : ' '}
      </Text>
    </View>
  );
}
