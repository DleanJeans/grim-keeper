import { StyleSheet, View } from 'react-native';

import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import type { RoleInfoSlot, RoleInfoTemplate } from '@/utils/role-info-utils';

export type RoleInfoRowProps = {
  /** Phase label of the entry when it was recorded in an earlier phase. */
  carriedFromLabel?: string;
  neighbors?: Player[];
  onPressSlot: (slot: RoleInfoSlot) => void;
  owners: Player[];
  playersById: Map<string, Player>;
  role: Role;
  rolesById: Map<string, Role>;
  template: RoleInfoTemplate;
  values: Record<string, string>;
};

/** One character's row in the info table: role cell, then a token per info slot. */
export function RoleInfoRow({
  carriedFromLabel,
  neighbors,
  onPressSlot,
  owners,
  playersById,
  role,
  rolesById,
  template,
  values,
}: RoleInfoRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.roleCell}>
        <RoleIcon role={role} size={30} />
        <View style={styles.roleText}>
          <Text numberOfLines={2} style={styles.roleName}>
            {role.name}
          </Text>
          {owners.length > 0 ? (
            <Text numberOfLines={2} style={styles.owners}>
              {owners.map((owner) => owner.name).join(', ')}
            </Text>
          ) : null}
          {carriedFromLabel ? (
            <Text numberOfLines={1} style={styles.carried}>
              {carriedFromLabel}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.infoCell}>
        {template.slots.length > 0 ? (
          <View style={styles.tokens}>
            {template.slots.map((slot) => (
              <RoleInfoToken
                key={slot.id}
                onPress={() => onPressSlot(slot)}
                player={getSlotPlayer(slot, values[slot.id], playersById)}
                role={getSlotRole(slot, values[slot.id], rolesById)}
                slot={slot}
                value={values[slot.id]}
              />
            ))}
          </View>
        ) : null}
        {template.autoNeighbors ? (
          <Text style={styles.neighbors}>
            {neighbors?.length
              ? `Neighbors: ${neighbors.map((neighbor) => neighbor.name).join(' · ')}`
              : 'Neighbors: claim this role to show'}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carried: {
    color: colors.roleInfoCarried,
    fontSize: 10,
    fontStyle: 'italic',
  },
  infoCell: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  neighbors: {
    color: colors.roleInfoNeighbor,
    fontSize: 11,
    fontWeight: '700',
  },
  owners: {
    color: colors.roleClaim,
    fontSize: 10,
    fontWeight: '700',
  },
  roleCell: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    width: 112,
  },
  roleName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  roleText: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  row: {
    alignItems: 'flex-start',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  tokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

function getSlotPlayer(
  slot: RoleInfoSlot,
  value: string | undefined,
  playersById: Map<string, Player>,
) {
  return slot.kind === 'player' && value ? playersById.get(value) : undefined;
}

function getSlotRole(slot: RoleInfoSlot, value: string | undefined, rolesById: Map<string, Role>) {
  return slot.kind === 'role' && value ? rolesById.get(value) : undefined;
}
