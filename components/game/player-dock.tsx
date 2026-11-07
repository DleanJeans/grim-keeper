import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  FlameKindling,
  HeartPulse,
  Megaphone,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Skull,
  Tag,
  Undo2,
} from 'lucide-react-native';
import { type ComponentType, useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';

import { canKillDuringDay } from '@/components/game/deaths-tab/death-actions';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { NomIcon } from '@/components/game/noms-tab/nom-icon';
import { QUICK_TAGS, QuickNoteTags } from '@/components/game/notes-tab/quick-note-tags';
import { SuspicionPicker } from '@/components/game/notes-tab/suspicion-picker';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { PlayerRoleAssignment } from '@/types/game';
import { isDeadBanshee } from '@/utils/player-utils';
import { getPlayerSuspicion, type SuspicionLevel } from '@/utils/suspicion-utils';

type IconComponent = ComponentType<{ color: string; size: number; strokeWidth?: number }>;
type ActionTone = 'default' | 'execute' | 'kill' | 'revive';
type AssignmentKind = PlayerRoleAssignment['kind'];

const NOTE_ACTIONS: { icon: IconComponent; kind: AssignmentKind; label: string }[] = [
  { icon: Tag, kind: 'claim', label: 'Claim' },
  { icon: ShieldCheck, kind: 'confirm', label: 'Confirm' },
  { icon: Megaphone, kind: 'rumor', label: 'Rumor' },
  { icon: CircleHelp, kind: 'guess', label: 'Guess' },
];

const ACTION_TONE_COLORS: Record<ActionTone, string> = {
  default: colors.gameTextSoft,
  execute: colors.deathExecution,
  kill: colors.deathNight,
  revive: colors.revive,
};

const SUSPICION_CHIPS: Record<
  SuspicionLevel,
  { color: string; icon: IconComponent; label: string }
> = {
  suspect: { color: colors.suspicionSuspect, icon: ShieldAlert, label: 'Suspect' },
  trusted: { color: colors.suspicionTrusted, icon: ShieldCheck, label: 'Trusted' },
  unsure: { color: colors.suspicionUnsure, icon: CircleHelp, label: 'Unsure' },
};

type PlayerDockProps = {
  /** Opens the kill attribution panel on the Deaths tab. */
  onStartKill: () => void;
  /** Opens the Claim / Confirm / Rumor / Guess picker for the selected player. */
  onStartRoleAssignment: (kind: AssignmentKind) => void;
  /** Starts tracking a nomination or interaction from the selected player. */
  onStartTracking: (mode: 'interaction' | 'nomination') => void;
};

/** The selected player's trust, tags and note buttons, kept at the bottom of the screen. */
export function PlayerDock({
  onStartKill,
  onStartRoleAssignment,
  onStartTracking,
}: PlayerDockProps) {
  const {
    activeDay,
    activePhase,
    focusedPlayer,
    focusedPlayerIsDead,
    game,
    handleCancelRoleAssignment,
    handleReviveFocusedPlayer,
    handleSetFocusedPlayerDeath,
    handleUndoFocusedPlayerDeath,
    interactionMode,
    nominationDisabled,
    roleAssignmentKind,
  } = useGameRouteContext();
  const [expanded, setExpanded] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardShown(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardShown(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (!focusedPlayer || keyboardShown) {
    return null;
  }

  const canMark = !interactionMode && !focusedPlayer.isStoryteller;
  const suspicion = getPlayerSuspicion(game.suspicions, focusedPlayer.id, activeDay, activePhase);
  const activeTags =
    game.playerDayNotes
      ?.find(
        (entry) =>
          entry.playerId === focusedPlayer.id &&
          entry.day === activeDay &&
          (entry.phase ?? 'day') === activePhase,
      )
      ?.notes.filter((note) => QUICK_TAGS.includes(note.text))
      .map((note) => note.text) ?? [];
  const showActions = !interactionMode && !!game.script;
  const isDay = activePhase === 'day';
  const toggleExpanded = () => setExpanded((value) => !value);

  return (
    <View style={styles.dock}>
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.name}>
          {focusedPlayer.name}
        </Text>
        {canMark ? (
          <Pressable
            accessibilityHint="Shows trust and tags for this player"
            accessibilityLabel={`Trust and tags for ${focusedPlayer.name}`}
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            hitSlop={6}
            onPress={toggleExpanded}
            style={({ pressed }) => [styles.summary, pressed && styles.summaryPressed]}
          >
            <View style={styles.summaryChips}>
              {suspicion ? (
                <SuspicionChip level={suspicion} />
              ) : (
                <Text style={styles.placeholder}>Trust</Text>
              )}
              {activeTags.length > 0 ? (
                <Text numberOfLines={1} style={styles.tags}>
                  {activeTags.join(', ')}
                </Text>
              ) : (
                <Text style={styles.placeholder}>Tags</Text>
              )}
            </View>
            {expanded ? (
              <ChevronDown color={colors.gameTextMuted} size={18} strokeWidth={2.6} />
            ) : (
              <ChevronUp color={colors.gameTextMuted} size={18} strokeWidth={2.6} />
            )}
          </Pressable>
        ) : null}
      </View>
      {canMark && expanded ? (
        <View style={styles.expanded}>
          <SuspicionPicker />
          <QuickNoteTags />
        </View>
      ) : null}
      {showActions ? (
        <View style={styles.actions}>
          {NOTE_ACTIONS.map(({ icon, kind, label }) => (
            <NoteActionButton
              icon={icon}
              key={kind}
              label={label}
              onPress={() =>
                roleAssignmentKind === kind
                  ? handleCancelRoleAssignment()
                  : onStartRoleAssignment(kind)
              }
              selected={roleAssignmentKind === kind}
            />
          ))}
        </View>
      ) : null}
      {canMark ? (
        <>
          {showActions ? <View style={styles.divider} /> : null}
          <View style={styles.actions}>
            {isDay ? (
              <NoteActionButton
                disabled={nominationDisabled}
                icon={NomIcon}
                label={
                  nominationDisabled &&
                  (!focusedPlayerIsDead || isDeadBanshee(focusedPlayer, activeDay, activePhase))
                    ? 'Nominated'
                    : 'Nominate'
                }
                onPress={() => onStartTracking('nomination')}
              />
            ) : null}
            {focusedPlayerIsDead ? (
              <>
                <NoteActionButton
                  accessibilityLabel={`Undo death for ${focusedPlayer.name}`}
                  icon={Undo2}
                  label="Undo death"
                  onPress={handleUndoFocusedPlayerDeath}
                />
                <NoteActionButton
                  icon={HeartPulse}
                  label="Revive"
                  onPress={handleReviveFocusedPlayer}
                  tone="revive"
                />
              </>
            ) : (
              <>
                {isDay ? (
                  <NoteActionButton
                    accessibilityLabel={`Mark ${focusedPlayer.name} dead by execution`}
                    icon={FlameKindling}
                    label="Execute"
                    onPress={() => handleSetFocusedPlayerDeath('execution')}
                    tone="execute"
                  />
                ) : null}
                {!isDay || canKillDuringDay(game.script) ? (
                  <NoteActionButton
                    accessibilityLabel={`Mark ${focusedPlayer.name} dead`}
                    icon={Skull}
                    label="Kill"
                    onPress={onStartKill}
                    tone="kill"
                  />
                ) : null}
              </>
            )}
            {isDay ? (
              <NoteActionButton
                accessibilityLabel={`Track interaction from ${focusedPlayer.name}`}
                icon={MessageCircle}
                label="Talk"
                onPress={() => onStartTracking('interaction')}
              />
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    flexBasis: 0,
    gap: 3,
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 0,
  },
  actionLabel: { fontSize: 12, fontWeight: '800' },
  actionLabelDefault: { color: colors.gameTextSoft },
  actionLabelExecute: { color: colors.deathExecution },
  actionLabelKill: { color: colors.deathNight },
  actionLabelRevive: { color: colors.revive },
  actionLabelSelected: { color: colors.onPrimary },
  actionPressed: { backgroundColor: colors.gameSurfacePressed },
  actionSelected: { backgroundColor: colors.primary },
  actionDisabled: { opacity: 0.4 },
  actions: { flexDirection: 'row', gap: 4 },
  divider: { backgroundColor: colors.gameBorder, height: 1, marginHorizontal: 4 },
  dock: {
    backgroundColor: colors.gameSurface,
    borderTopColor: colors.gameBorder,
    borderTopWidth: 1,
    gap: 8,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  expanded: { gap: 10 },
  headerRow: { alignItems: 'center', flexDirection: 'row', gap: 10, minHeight: 36 },
  name: { color: colors.gameText, flexShrink: 1, fontSize: 16, fontWeight: '900' },
  placeholder: { color: colors.gameTextSubtle, fontSize: 13, fontWeight: '700' },
  suspicionChip: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  suspicionLabel: { fontSize: 12, fontWeight: '800' },
  summary: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    minHeight: 36,
    minWidth: 0,
    paddingLeft: 6,
    paddingRight: 8,
  },
  summaryChips: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 8, minWidth: 0 },
  summaryPressed: { backgroundColor: colors.gameSurfacePressed },
  suspectChip: { borderColor: colors.suspicionSuspect },
  suspectLabel: { color: colors.suspicionSuspect },
  tags: { color: colors.gameTextSoft, flexShrink: 1, fontSize: 13, fontWeight: '700' },
  trustedChip: { borderColor: colors.suspicionTrusted },
  trustedLabel: { color: colors.suspicionTrusted },
  unsureChip: { borderColor: colors.suspicionUnsure },
  unsureLabel: { color: colors.suspicionUnsure },
});

const actionLabelToneStyles = {
  default: styles.actionLabelDefault,
  execute: styles.actionLabelExecute,
  kill: styles.actionLabelKill,
  revive: styles.actionLabelRevive,
};

const suspicionChipStyles = {
  suspect: { chip: styles.suspectChip, label: styles.suspectLabel },
  trusted: { chip: styles.trustedChip, label: styles.trustedLabel },
  unsure: { chip: styles.unsureChip, label: styles.unsureLabel },
};

function SuspicionChip({ level }: { level: SuspicionLevel }) {
  const { color, icon: Icon, label } = SUSPICION_CHIPS[level];
  return (
    <View style={[styles.suspicionChip, suspicionChipStyles[level].chip]}>
      <Icon color={color} size={14} strokeWidth={2.6} />
      <Text style={[styles.suspicionLabel, suspicionChipStyles[level].label]}>{label}</Text>
    </View>
  );
}

function NoteActionButton({
  accessibilityLabel,
  disabled = false,
  icon: Icon,
  label,
  onPress,
  selected = false,
  tone = 'default',
}: {
  accessibilityLabel?: string;
  disabled?: boolean;
  icon: IconComponent;
  label: string;
  onPress: () => void;
  selected?: boolean;
  /** Colour of the icon and label, such as red for Execute. */
  tone?: ActionTone;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? (selected ? `Close ${label}` : label)}
      accessibilityRole="button"
      accessibilityState={{ disabled, selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        selected ? styles.actionSelected : pressed && styles.actionPressed,
        disabled && styles.actionDisabled,
      ]}
    >
      <Icon
        color={selected ? colors.onPrimary : ACTION_TONE_COLORS[tone]}
        size={18}
        strokeWidth={2.5}
      />
      <Text
        style={[
          styles.actionLabel,
          actionLabelToneStyles[tone],
          selected && styles.actionLabelSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
