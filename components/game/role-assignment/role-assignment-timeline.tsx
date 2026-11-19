import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { getStops, type Stop } from '@/components/game/phase-timeline';
import { ROLE_KINDS, type RoleKind } from '@/components/game/role-assignment/role-kinds';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { GamePhase, Role, StartingNight } from '@/types/game';
import {
  type GamePhasePosition,
  getPhaseIndex,
  getPhaseLabel,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';
import type { RoleAssignmentHistoryEntry } from '@/utils/role-assignment-history';
import { getRolesByIds } from '@/utils/role-utils';

const cardColors = colors.dayCard;
const DOT_SIZE = 12;
const CURRENT_DOT_SIZE = 16;
const MARK_TOKEN_SIZE = 22;

type RoleAssignmentTimelineProps = {
  activePhase: GamePhasePosition;
  entries: RoleAssignmentHistoryEntry[];
  knownRoles: Role[];
  latestPhase: GamePhasePosition;
  showRoles: boolean;
  startingNight: StartingNight;
  onChangePhase: (day: number, phase: GamePhase) => void;
  onRemove: (entry: RoleAssignmentHistoryEntry) => void;
};

/**
 * The phase timeline with the logged roles where the death marks go. Tap a phase with a mark to
 * see what was logged then, and remove it or jump to that phase.
 */
export function RoleAssignmentTimeline({
  activePhase,
  entries,
  knownRoles,
  latestPhase,
  onChangePhase,
  onRemove,
  showRoles,
  startingNight,
}: RoleAssignmentTimelineProps) {
  const kind = entries[0]?.kind ?? 'claim';
  const currentIndex = getPhaseIndex(activePhase);
  const lastIndex = Math.max(currentIndex, getPhaseIndex(latestPhase));
  const stops = getStops(currentIndex, lastIndex);
  const latestEntry = entries.at(-1);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const pickedEntry = entries.find((entry) => entry.phaseIndex === pickedIndex) ?? latestEntry;

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {stops.map((stop, slot) => {
          const entry = getEntryForStop(entries, stop);
          return (
            <TimelineStop
              currentIndex={currentIndex}
              entry={entry}
              kind={kind}
              first={slot === 0}
              key={`${stop.kind}-${stop.index}`}
              knownRoles={knownRoles}
              last={slot === stops.length - 1}
              lastIndex={lastIndex}
              onPress={() => entry && setPickedIndex(entry.phaseIndex)}
              selected={!!entry && entry.phaseIndex === pickedEntry?.phaseIndex}
              showRoles={showRoles}
              startingNight={startingNight}
              stop={stop}
            />
          );
        })}
      </View>
      {pickedEntry ? (
        <EntryDetail
          currentIndex={currentIndex}
          entry={pickedEntry}
          isInEffect={
            pickedEntry === entries.filter((entry) => entry.phaseIndex <= currentIndex).at(-1)
          }
          knownRoles={knownRoles}
          onChangePhase={onChangePhase}
          onRemove={() => {
            setPickedIndex(null);
            onRemove(pickedEntry);
          }}
          showRoles={showRoles}
          startingNight={startingNight}
        />
      ) : null}
    </View>
  );
}

/** The entry drawn at a stop; the folded "…" stop stands for every phase before it. */
function getEntryForStop(entries: RoleAssignmentHistoryEntry[], stop: Stop) {
  if (stop.kind === 'upcoming') return undefined;
  if (stop.kind === 'earlier') {
    return entries.filter((entry) => entry.phaseIndex <= stop.index).at(-1);
  }
  return entries.find((entry) => entry.phaseIndex === stop.index);
}

function TimelineStop({
  currentIndex,
  entry,
  first,
  kind,
  knownRoles,
  last,
  lastIndex,
  onPress,
  selected,
  showRoles,
  startingNight,
  stop,
}: {
  currentIndex: number;
  entry?: RoleAssignmentHistoryEntry;
  first: boolean;
  kind: RoleKind;
  knownRoles: Role[];
  last: boolean;
  lastIndex: number;
  onPress: () => void;
  selected: boolean;
  showRoles: boolean;
  startingNight: StartingNight;
  stop: Stop;
}) {
  const position = getPhasePositionAtIndex(stop.index);
  const label = getPhaseLabel(position, startingNight);
  const shortLabel = stop.kind === 'earlier' ? '…' : `${label[0]}${label.split(' ')[1]}`;
  const night = position.activePhase === 'night';
  const current = stop.index === currentIndex;
  const roles = entry && showRoles ? getRolesByIds(entry.roleIds, knownRoles).slice(0, 2) : [];

  return (
    <Pressable
      accessibilityLabel={entry ? `Show what was logged on ${label}` : label}
      accessibilityRole="button"
      disabled={!entry}
      onPress={onPress}
      style={styles.stop}
    >
      {selected ? <View style={[styles.selectedFrame, kindStyles[kind].frame]} /> : null}
      <View style={styles.markRow}>
        {entry && roles.length > 0 ? (
          roles.map((role, index) => (
            <View key={role.id} style={[styles.markToken, index > 0 && styles.overlappedMark]}>
              <RoleIcon role={role} scale={1.25} size={MARK_TOKEN_SIZE - 2} />
            </View>
          ))
        ) : entry ? (
          <View style={[styles.gem, kindStyles[kind].gem]} />
        ) : null}
      </View>
      <View style={styles.dotRow}>
        {first ? null : (
          <View
            style={[
              styles.line,
              styles.leftLine,
              stop.index <= lastIndex ? styles.pastLine : styles.upcomingLine,
            ]}
          />
        )}
        {last ? null : (
          <View
            style={[
              styles.line,
              styles.rightLine,
              stop.index + 1 <= lastIndex ? styles.pastLine : styles.upcomingLine,
            ]}
          />
        )}
        <View
          style={[
            styles.dot,
            night ? styles.nightDot : styles.dayDot,
            stop.index < currentIndex && styles.pastDot,
            stop.kind === 'earlier' && styles.earlierDot,
            stop.kind === 'upcoming' && styles.upcomingDot,
            current && styles.currentDot,
          ]}
        />
      </View>
      <Text style={[styles.label, current && styles.currentLabel, entry && kindStyles[kind].text]}>
        {shortLabel}
      </Text>
    </Pressable>
  );
}

function EntryDetail({
  currentIndex,
  entry,
  isInEffect,
  knownRoles,
  onChangePhase,
  onRemove,
  showRoles,
  startingNight,
}: {
  currentIndex: number;
  entry: RoleAssignmentHistoryEntry;
  isInEffect: boolean;
  knownRoles: Role[];
  onChangePhase: (day: number, phase: GamePhase) => void;
  onRemove: () => void;
  showRoles: boolean;
  startingNight: StartingNight;
}) {
  const past = ROLE_KINDS.find((info) => info.kind === entry.kind)?.past ?? 'Claimed';
  const position = getPhasePositionAtIndex(entry.phaseIndex);
  const label = getPhaseLabel(position, startingNight);
  const names = getRolesByIds(entry.roleIds, knownRoles).map((role) => role.name);
  const what = showRoles
    ? `${past} ${names.join(', ')}`
    : `${past} ${names.length} role${names.length === 1 ? '' : 's'}`;
  const currentLabel = getPhaseLabel(getPhasePositionAtIndex(currentIndex), startingNight);
  const carried = isInEffect && entry.phaseIndex < currentIndex;

  return (
    <View style={styles.detail}>
      <View style={[styles.phasePill, kindStyles[entry.kind].pill]}>
        <Text style={[styles.phasePillText, kindStyles[entry.kind].text]}>
          {`${label[0]}${label.split(' ')[1]}`}
        </Text>
      </View>
      <View style={styles.detailText}>
        <Text style={styles.what}>
          {what}
          {entry.ownerName ? ` · from ${entry.ownerName}` : ''}
        </Text>
        {carried ? <Text style={styles.carried}>Still showing on {currentLabel}</Text> : null}
      </View>
      {entry.phaseIndex !== currentIndex ? (
        <Pressable
          accessibilityLabel={`Go to ${label}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangePhase(position.activeDay, position.activePhase)}
        >
          <Text style={styles.goTo}>Go to</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityLabel={`Remove ${label}`}
        accessibilityRole="button"
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
      >
        <Text style={styles.removeText}>Remove</Text>
      </Pressable>
    </View>
  );
}

function createKindStyles(color: string) {
  return StyleSheet.create({
    frame: { backgroundColor: `${color}29`, borderColor: color },
    gem: { backgroundColor: color },
    pill: { borderColor: `${color}80` },
    text: { color },
  });
}

const kindStyles: Record<RoleKind, ReturnType<typeof createKindStyles>> = {
  claim: createKindStyles(colors.roleClaim),
  confirm: createKindStyles(colors.roleConfirm),
  guess: createKindStyles(colors.roleGuess),
  rumor: createKindStyles(colors.roleRumor),
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.gameBackground,
    borderColor: colors.gameBorder,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    padding: 6,
  },
  carried: { color: colors.gameTextMuted, fontSize: 11, fontWeight: '600' },
  currentDot: {
    backgroundColor: cardColors.currentDot,
    borderColor: cardColors.currentDot,
    borderRadius: CURRENT_DOT_SIZE / 2,
    boxShadow: `0 0 0 3px ${cardColors.currentHalo}`,
    height: CURRENT_DOT_SIZE,
    width: CURRENT_DOT_SIZE,
  },
  currentLabel: { color: cardColors.title },
  dayDot: { backgroundColor: cardColors.dayDot },
  detail: {
    alignItems: 'center',
    borderTopColor: colors.gameBorder,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 4,
    paddingTop: 6,
  },
  detailText: { flex: 1, gap: 1, minWidth: 0 },
  dot: {
    borderColor: cardColors.dotBorder,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    height: DOT_SIZE,
    width: DOT_SIZE,
  },
  dotRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    height: CURRENT_DOT_SIZE,
    justifyContent: 'center',
  },
  earlierDot: { backgroundColor: 'transparent', borderStyle: 'dotted' },
  gem: { borderRadius: 2, height: 9, marginBottom: 4, transform: [{ rotate: '45deg' }], width: 9 },
  goTo: {
    color: colors.gameTextMuted,
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  label: { color: colors.gameTextMuted, fontSize: 9.5, fontWeight: '800' },
  leftLine: { left: 0 },
  line: { height: 2, position: 'absolute', top: CURRENT_DOT_SIZE / 2 - 1, width: '50%' },
  markRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: MARK_TOKEN_SIZE,
    justifyContent: 'center',
  },
  markToken: {
    alignItems: 'center',
    backgroundColor: colors.roleInfoTokenBackground,
    borderColor: colors.roleInfoTokenFilledBorder,
    borderRadius: MARK_TOKEN_SIZE / 2,
    borderWidth: 1,
    height: MARK_TOKEN_SIZE,
    justifyContent: 'center',
    overflow: 'hidden',
    width: MARK_TOKEN_SIZE,
  },
  nightDot: { backgroundColor: cardColors.nightDot },
  overlappedMark: { marginLeft: -9 },
  pastDot: { borderColor: cardColors.pastDotBorder },
  pastLine: { backgroundColor: cardColors.pastLine },
  phasePill: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  phasePillText: { fontSize: 11, fontWeight: '900' },
  remove: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  removePressed: { opacity: 0.7 },
  removeText: { color: colors.danger, fontSize: 12, fontWeight: '900' },
  rightLine: { right: 0 },
  row: { flexDirection: 'row' },
  selectedFrame: {
    borderRadius: 8,
    borderWidth: 1,
    bottom: -3,
    left: '12%',
    position: 'absolute',
    right: '12%',
    top: -3,
  },
  stop: { alignItems: 'center', flex: 1, gap: 2, minWidth: 0 },
  upcomingDot: { backgroundColor: 'transparent', borderStyle: 'dashed' },
  upcomingLine: { backgroundColor: cardColors.line },
  what: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '700' },
});
