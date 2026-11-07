import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { NotFoundScreen } from '@/components/not-found-screen';
import { ResponsiveContent } from '@/components/responsive-content';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role, SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { getAssignedRoleIdsForDayOrPrevious, getRolesByIds } from '@/utils/role-utils';
import { detectRoleIdsInNote, getSavedNote } from '@/utils/saved-note-utils';

const EMPTY_ROLES: Role[] = [];

export default function SaveNoteForFutureScreen() {
  const {
    day,
    gameId,
    playerId,
    text = '',
  } = useLocalSearchParams<{
    day: string;
    gameId: string;
    playerId: string;
    text?: string;
  }>();
  const games = useGameStore((state) => state.games);
  const savedNotes = useGameStore((state) => state.savedNotes);
  const saveNoteForFutureGames = useGameStore((state) => state.saveNoteForFutureGames);
  const removeNoteFromFutureGames = useGameStore((state) => state.removeNoteFromFutureGames);
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);
  const appUserName = useGameStore((state) => state.appUserName);
  const game = games.find((candidate) => candidate.id === gameId);
  const player = game?.players.find((candidate) => candidate.id === playerId);
  const roles = game?.script?.roles ?? EMPTY_ROLES;
  const noteDay = Number(day);
  const assignedRoleIds = useMemo(
    () => getAssignedRoleIdsForDayOrPrevious(player?.roleAssignments, noteDay),
    [noteDay, player?.roleAssignments],
  );
  const pickerRoles = useMemo(
    () => [
      ...new Map(
        [...roles, ...getRolesByIds(assignedRoleIds, roles)].map((role) => [role.id, role]),
      ).values(),
    ],
    [assignedRoleIds, roles],
  );
  const playerNote = player ? getSavedNote(savedNotes, player.name, text) : undefined;
  // The same note saved about the character only, with the player left out.
  const characterNote = getSavedNote(savedNotes, '', text);
  const savedNote = playerNote ?? characterNote;
  const initialRoleIds = useMemo(
    () => getInitialRoleIds(savedNote, text, roles, assignedRoleIds),
    [assignedRoleIds, roles, savedNote, text],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialRoleIds);
  const [tagPlayer, setTagPlayer] = useState(!characterNote || !!playerNote);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedRoleIds(initialRoleIds);
  }, [initialRoleIds]);

  if (!game || !player) {
    return <NotFoundScreen message="Note not found." title="Note not found" />;
  }

  const legacyRoleIds = roles
    .filter((role) => role.notes?.includes(text.trim()))
    .map((role) => role.id);
  const playerName = player.name;
  const isAppUser =
    normalizePlayerName(playerName).toLocaleLowerCase() ===
    normalizePlayerName(appUserName).toLocaleLowerCase();
  const canRemove = !!savedNote || legacyRoleIds.length > 0;
  const noteGameId = game.id;
  const noteScriptId = game.scriptId ?? game.script?.id;

  function handleToggleRole(roleId: string) {
    setSelectedRoleIds((currentRoleIds) =>
      currentRoleIds.includes(roleId)
        ? currentRoleIds.filter((currentRoleId) => currentRoleId !== roleId)
        : [...currentRoleIds, roleId],
    );
  }

  function handleSave() {
    const tagged = tagPlayer && !isAppUser;
    if (
      saveNoteForFutureGames(tagged ? playerName : '', selectedRoleIds, text, {
        gameId: noteGameId,
        day: noteDay,
        scriptId: noteScriptId,
      })
    ) {
      // Drop the copy saved the other way, so the note is only tagged the way just chosen.
      const otherNote = tagged ? characterNote : playerNote;
      if (otherNote) {
        deleteSavedNote(otherNote);
      }
      router.back();
      return;
    }

    setError(
      isAppUser
        ? 'Select at least one role before saving a note for yourself.'
        : `Select at least one role before saving a note without ${playerName}.`,
    );
  }

  function handleRemove() {
    if (playerNote && characterNote) {
      deleteSavedNote(characterNote);
    }
    const roleIds = savedNote?.roleIds ?? legacyRoleIds;
    const noteId = savedNote?.id;
    if (removeNoteFromFutureGames(playerName, roleIds, text, noteId)) {
      router.back();
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Save Note for Future' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        <ResponsiveContent style={styles.content}>
          <NotePreview day={noteDay} playerName={playerName} text={text} />

          {isAppUser ? null : (
            <TagPlayerSwitch onChange={setTagPlayer} playerName={playerName} value={tagPlayer} />
          )}

          {pickerRoles.length > 0 ? (
            <RolePicker
              description="Select every role where this note should appear. Mentioned roles and this player’s claimed or confirmed roles are selected automatically."
              onToggleRole={handleToggleRole}
              roles={pickerRoles}
              selectedFirst
              selectedRoleIds={selectedRoleIds}
              scriptId={noteScriptId}
            />
          ) : (
            <Text selectable style={styles.noScript}>
              Select a game script before choosing roles for this note.
            </Text>
          )}

          {error ? (
            <Text selectable style={styles.error}>
              {error}
            </Text>
          ) : null}

          <SaveNoteActions canRemove={canRemove} onRemove={handleRemove} onSave={handleSave} />
        </ResponsiveContent>
      </ScrollView>
    </>
  );
}

function getInitialRoleIds(
  savedNote: SavedNote | undefined,
  text: string,
  roles: Role[],
  assignedRoleIds: string[],
) {
  const legacyRoleIds = roles
    .filter((role) => role.notes?.includes(text.trim()))
    .map((role) => role.id);
  return [
    ...new Set([
      ...(savedNote?.roleIds ?? []),
      ...legacyRoleIds,
      ...detectRoleIdsInNote(text, roles),
      ...assignedRoleIds,
    ]),
  ];
}

function TagPlayerSwitch({
  onChange,
  playerName,
  value,
}: {
  onChange: (value: boolean) => void;
  playerName: string;
  value: boolean;
}) {
  return (
    <View style={styles.tagRow}>
      <View style={styles.tagCopy}>
        <Text style={styles.tagTitle}>{`Tag ${playerName}`}</Text>
        <Text style={styles.tagDescription}>
          {value
            ? `Saved about ${playerName} and the selected roles.`
            : `Only about the character: ${playerName} is left out of this note.`}
        </Text>
      </View>
      <Switch
        accessibilityLabel={`Tag ${playerName} in this note`}
        accessibilityRole="switch"
        accessibilityState={{ checked: value }}
        onValueChange={onChange}
        thumbColor={value ? colors.primary : colors.onDisabled}
        trackColor={{ false: colors.disabled, true: colors.borderStrong }}
        value={value}
      />
    </View>
  );
}

function NotePreview({ day, playerName, text }: { day: number; playerName: string; text: string }) {
  return (
    <View style={styles.preview}>
      <Text selectable style={styles.previewTitle}>
        {playerName} · Day {day}
      </Text>
      <Text selectable style={styles.previewText}>
        {text}
      </Text>
    </View>
  );
}

function SaveNoteActions({
  canRemove,
  onRemove,
  onSave,
}: {
  canRemove: boolean;
  onRemove: () => void;
  onSave: () => void;
}) {
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  if (confirmingRemove) {
    return (
      <View style={styles.actions}>
        <NoteActionButton icon={X} label="No" onPress={() => setConfirmingRemove(false)} />
        <NoteActionButton destructive icon={Trash2} label="Yes" onPress={onRemove} />
      </View>
    );
  }

  return (
    <View style={styles.actions}>
      {canRemove ? (
        <NoteActionButton
          destructive
          icon={Trash2}
          label="Remove"
          onPress={() => setConfirmingRemove(true)}
        />
      ) : null}
      <NoteActionButton icon={Check} label="Save" onPress={onSave} primary />
    </View>
  );
}

function NoteActionButton({
  destructive = false,
  icon: Icon,
  label,
  onPress,
  primary = false,
}: {
  destructive?: boolean;
  icon: typeof Check;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  const foreground = destructive ? colors.danger : primary ? colors.onPrimary : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        destructive
          ? styles.actionButtonDestructive
          : pressed
            ? styles.actionButtonPressed
            : primary
              ? styles.actionButtonPrimary
              : null,
      ]}
    >
      <Icon color={foreground} size={17} strokeWidth={2.7} />
      <Text
        style={[
          styles.actionLabel,
          destructive ? styles.actionLabelDestructive : primary ? styles.actionLabelPrimary : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  actionButtonDestructive: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.dangerBorder,
  },
  actionButtonPressed: {
    backgroundColor: colors.surfacePressed,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '800',
  },
  actionLabelDestructive: {
    color: colors.danger,
  },
  actionLabelPrimary: {
    color: colors.onPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  content: {
    gap: 18,
    padding: 20,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  noScript: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  preview: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  previewText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  tagCopy: {
    flex: 1,
    gap: 4,
  },
  tagDescription: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  tagRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 14,
  },
  tagTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  scroll: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
