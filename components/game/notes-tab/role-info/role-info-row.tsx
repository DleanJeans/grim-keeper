import { Pressable, StyleSheet, View } from 'react-native';

import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import type { RoleInfoSlot, RoleInfoTemplate } from '@/utils/role-info-utils';

const NEIGHBOR_SLOT: RoleInfoSlot = { id: 'neighbor', kind: 'player', label: 'Neighbor' };
const EXECUTED_SLOT: RoleInfoSlot = { id: 'executed', kind: 'player', label: 'Executed' };

/** One line of tokens: a single phase, or one night of a character that acts every night. */
export type RoleInfoLine = {
  key: string;
  /** Night label, or where carried or inferred values came from. */
  label?: string;
  /** Player executed the day before, shown read-only for the Undertaker. */
  executed?: Player;
  /** Marks the end of the character's info: its players are dead. */
  isDead?: boolean;
  neighbors?: Player[];
  /** Slot of the statement marked as possibly true; the other statements show as false. */
  trueSlotId?: string;
  onPressSlot: (slot: RoleInfoSlot) => void;
  values: Record<string, string>;
};

export type RoleInfoRowProps = {
  lines: RoleInfoLine[];
  owners: Player[];
  playersById: Map<string, Player>;
  role: Role;
  rolesById: Map<string, Role>;
  template: RoleInfoTemplate;
};

/** One character's row in the info table: role cell, then a line of tokens per phase shown. */
export function RoleInfoRow({
  lines,
  owners,
  playersById,
  role,
  rolesById,
  template,
}: RoleInfoRowProps) {
  return (
    <View style={styles.row}>
      <RoleReference
        containerStyle={styles.roleCell}
        contentStyle={styles.roleText}
        iconScale={1}
        iconSize={30}
        role={role}
        textStyle={styles.roleName}
      >
        {owners.length > 0 ? (
          <Text numberOfLines={2} style={styles.owners}>
            {owners.map((owner) => owner.name).join(', ')}
          </Text>
        ) : null}
      </RoleReference>
      <View style={styles.infoCell}>
        {lines.map((line) => (
          <RoleInfoLineTokens
            key={line.key}
            line={line}
            playersById={playersById}
            rolesById={rolesById}
            template={template}
          />
        ))}
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
  dead: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  infoCell: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  line: {
    gap: 4,
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
    gap: 6,
    width: 136,
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
  statementFalse: {
    color: colors.danger,
  },
  statementOr: {
    color: colors.textMuted,
    fontWeight: '700',
  },
  statementTrue: {
    color: colors.roleInfoTokenTrueBorder,
  },
  statements: {
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statementsEmpty: {
    borderColor: colors.roleInfoTokenEmptyBorder,
    borderStyle: 'dashed',
  },
  statementsPressed: {
    backgroundColor: colors.surfacePressed,
  },
  statementsText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  statementPlaceholder: {
    color: colors.textSubtle,
  },
  tokens: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
});

function RoleInfoLineTokens({
  line,
  playersById,
  rolesById,
  template,
}: {
  line: RoleInfoLine;
  playersById: Map<string, Player>;
  rolesById: Map<string, Role>;
  template: RoleInfoTemplate;
}) {
  const { executed, isDead, label, neighbors, onPressSlot, trueSlotId, values } = line;

  if (isDead) {
    return <Text style={styles.dead}>{label}</Text>;
  }

  return (
    <View style={styles.line}>
      {label ? (
        <Text numberOfLines={1} style={styles.carried}>
          {label}
        </Text>
      ) : null}
      {template.markTrue ? (
        <StatementsBox
          onPressSlot={onPressSlot}
          slots={template.slots}
          trueSlotId={trueSlotId}
          values={values}
        />
      ) : template.slots.length > 0 || neighbors?.length ? (
        <View style={styles.tokens}>
          {executed ? (
            <RoleInfoToken player={executed} slot={EXECUTED_SLOT} value={executed.id} />
          ) : null}
          {neighbors?.map((neighbor) => (
            <RoleInfoToken
              key={`neighbor-${neighbor.id}`}
              player={neighbor}
              slot={NEIGHBOR_SLOT}
              value={neighbor.id}
            />
          ))}
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
      {template.autoNeighbors && !neighbors?.length ? (
        <Text style={styles.neighbors}>Neighbors: claim this role to show</Text>
      ) : null}
    </View>
  );
}

/**
 * The statements in one rectangle, "A or B", so long ones fit. A statement marked true shows green
 * and the others red.
 */
function StatementsBox({
  onPressSlot,
  slots,
  trueSlotId,
  values,
}: {
  onPressSlot: (slot: RoleInfoSlot) => void;
  slots: RoleInfoSlot[];
  trueSlotId?: string;
  values: Record<string, string>;
}) {
  const isEmpty = slots.every((slot) => !values[slot.id]);
  const firstEmptySlot = slots.find((slot) => !values[slot.id]) ?? slots[0];

  return (
    <Pressable
      accessibilityLabel={slots
        .map((slot) => `${slot.label}: ${values[slot.id] ?? 'empty'}`)
        .join(', ')}
      accessibilityRole="button"
      onPress={() => firstEmptySlot && onPressSlot(firstEmptySlot)}
      style={({ pressed }) => [
        styles.statements,
        isEmpty && styles.statementsEmpty,
        pressed && styles.statementsPressed,
      ]}
    >
      <Text style={styles.statementsText}>
        {slots.map((slot, index) => (
          <StatementText
            isFirst={index === 0}
            key={slot.id}
            mark={trueSlotId === undefined ? undefined : slot.id === trueSlotId}
            slot={slot}
            value={values[slot.id]}
          />
        ))}
      </Text>
    </Pressable>
  );
}

function StatementText({
  isFirst,
  mark,
  slot,
  value,
}: {
  isFirst: boolean;
  /** True or false once a statement of the day is marked true. */
  mark?: boolean;
  slot: RoleInfoSlot;
  value?: string;
}) {
  return (
    <Text>
      {isFirst ? null : <Text style={styles.statementOr}> or </Text>}
      <Text
        style={[
          !value && styles.statementPlaceholder,
          mark === true && styles.statementTrue,
          mark === false && styles.statementFalse,
        ]}
      >
        {value ?? slot.label}
      </Text>
    </Text>
  );
}

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
