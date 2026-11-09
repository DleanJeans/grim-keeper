import { MapPin, Plus } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  type KnavesLineStoryteller,
  KnavesStorytellerBadge,
} from '@/components/game/notes-tab/role-info/knaves-storyteller-badge';
import { RoleInfoDiceButton } from '@/components/game/notes-tab/role-info/role-info-dice-button';
import { RoleInfoToken } from '@/components/game/notes-tab/role-info/role-info-token';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import type { DayBeforePlayers, RoleInfoSlot, RoleInfoTemplate } from '@/utils/role-info-utils';

const NEIGHBOR_SLOT: RoleInfoSlot = { id: 'neighbor', kind: 'player', label: 'Neighbor' };
const EXECUTED_SLOT: RoleInfoSlot = { id: 'executed', kind: 'player', label: 'Executed' };
const DAY_BEFORE_LABELS: Record<DayBeforePlayers, string> = {
  nominators: 'Nominated',
  voters: 'Voted',
};

/** One line of tokens: a single phase, or one night of a character that acts every night. */
export type RoleInfoLine = {
  key: string;
  /** Night label, or where carried or inferred values came from. */
  label?: string;
  /** Player executed the day before, shown read-only for the Undertaker. */
  executed?: Player;
  /** Who nominated or voted the day before, shown read-only for the Town Crier and Flowergirl. */
  dayBefore?: {
    kind: DayBeforePlayers;
    /** Scrolls up to the map and highlights the players. */
    onHighlight: () => void;
    players: Player[];
  };
  /** Marks the end of the character's info: its players are dead. */
  isDead?: boolean;
  neighbors?: Player[];
  /** Knaves: the Storyteller who gave this line's info; unset without the Knaves. */
  storyteller?: KnavesLineStoryteller;
  /** Slot of the statement marked as possibly true; the other statements show as false. */
  trueSlotId?: string;
  onPressSlot: (slot: RoleInfoSlot) => void;
  /** Fills the line with fake info that fits the fake evil team; set while the dice drawer is open. */
  onRandomize?: () => void;
  values: Record<string, string>;
};

export type RoleInfoRowProps = {
  /** Shown under the row, above its separator, such as the character's saved notes. */
  footer?: ReactNode;
  lines: RoleInfoLine[];
  owners: Player[];
  playersById: Map<string, Player>;
  role: Role;
  rolesById: Map<string, Role>;
  template: RoleInfoTemplate;
};

/** One character's row in the info table: role cell, then a line of tokens per phase shown. */
export function RoleInfoRow({
  footer,
  lines,
  owners,
  playersById,
  role,
  rolesById,
  template,
}: RoleInfoRowProps) {
  return (
    <View style={styles.item}>
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
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  carried: {
    color: colors.roleInfoCarried,
    fontSize: 10,
    fontStyle: 'italic',
  },
  dayBefore: {
    color: colors.roleInfoNeighbor,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  dayBeforeButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 2,
  },
  dayBeforeButtonPressed: {
    backgroundColor: colors.surfacePressed,
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
  // Info from the Storyteller thought to lie fades back.
  lie: {
    opacity: 0.5,
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
  rect: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 46,
    minWidth: 60,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  rectContainer: {
    alignItems: 'center',
    flexShrink: 0,
    gap: 3,
  },
  rectContainerText: {
    alignItems: 'stretch',
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  rectEmpty: {
    borderColor: colors.roleInfoTokenEmptyBorder,
    borderStyle: 'dashed',
  },
  rectLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  rectPressed: {
    backgroundColor: colors.surfacePressed,
  },
  rectText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  rects: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 6,
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
  item: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
    paddingVertical: 8,
  },
  row: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
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
  storytellerLabel: {
    flexShrink: 1,
  },
  storytellerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
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
  const {
    dayBefore,
    executed,
    isDead,
    label,
    neighbors,
    onPressSlot,
    onRandomize,
    storyteller,
    trueSlotId,
    values,
  } = line;

  if (isDead) {
    return <Text style={styles.dead}>{label}</Text>;
  }

  return (
    <View style={styles.line}>
      {storyteller ? (
        <View style={styles.storytellerRow}>
          <KnavesStorytellerBadge storyteller={storyteller} />
          {label ? (
            <Text numberOfLines={1} style={[styles.carried, styles.storytellerLabel]}>
              {label}
            </Text>
          ) : null}
        </View>
      ) : label ? (
        <Text numberOfLines={1} style={styles.carried}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.line, storyteller?.verdict === 'lie' && styles.lie]}>
        {template.markTrue ? (
          <StatementsBox
            onPressSlot={onPressSlot}
            slots={template.slots}
            trueSlotId={trueSlotId}
            values={values}
          />
        ) : template.rectangles ? (
          <View style={styles.rects}>
            {template.slots.map((slot) =>
              slot.kind === 'text' || slot.kind === 'choice' ? (
                <SlotRect
                  key={slot.id}
                  onPress={() => onPressSlot(slot)}
                  slot={slot}
                  value={values[slot.id]}
                />
              ) : (
                <RoleInfoToken
                  key={slot.id}
                  onPress={() => onPressSlot(slot)}
                  player={getSlotPlayer(slot, values[slot.id], playersById)}
                  role={getSlotRole(slot, values[slot.id], rolesById)}
                  slot={slot}
                  value={values[slot.id]}
                />
              ),
            )}
          </View>
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
            {onRandomize ? <RoleInfoDiceButton onPress={onRandomize} /> : null}
          </View>
        ) : null}
      </View>
      {dayBefore ? (
        <Pressable
          accessibilityHint="Scrolls up to the map and highlights them"
          accessibilityRole="button"
          disabled={dayBefore.players.length === 0}
          hitSlop={6}
          onPress={dayBefore.onHighlight}
          style={({ pressed }) => [
            styles.dayBeforeButton,
            pressed && styles.dayBeforeButtonPressed,
          ]}
        >
          {dayBefore.players.length > 0 ? (
            <MapPin color={colors.roleInfoNeighbor} size={14} strokeWidth={2.5} />
          ) : null}
          <Text style={styles.dayBefore}>
            {DAY_BEFORE_LABELS[dayBefore.kind]}:{' '}
            {dayBefore.players.length > 0
              ? dayBefore.players.map((player) => player.name).join(', ')
              : 'none logged'}
          </Text>
        </Pressable>
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

/** One slot as a rectangle that grows to fit long text; a text slot takes the free width. */
function SlotRect({
  onPress,
  slot,
  value,
}: {
  onPress: () => void;
  slot: RoleInfoSlot;
  value?: string;
}) {
  return (
    <View style={[styles.rectContainer, slot.kind === 'text' && styles.rectContainerText]}>
      <Pressable
        accessibilityLabel={`${slot.label}: ${value ?? 'empty'}`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          styles.rect,
          value === undefined && styles.rectEmpty,
          pressed && styles.rectPressed,
        ]}
      >
        {value === undefined ? (
          <Plus color={colors.textSubtle} size={18} strokeWidth={2.5} />
        ) : (
          <Text style={styles.rectText}>{value}</Text>
        )}
      </Pressable>
      <Text numberOfLines={1} style={styles.rectLabel}>
        {slot.label}
      </Text>
    </View>
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
