import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, Trash2, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { RolePicker } from '@/components/game/notes-tab/role-picker';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role, SavedNote } from '@/types/game';
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
  const savedNote = player ? getSavedNote(savedNotes, player.name, text) : undefined;
  const initialRoleIds = useMemo(
    () => getInitialRoleIds(savedNote, text, roles, assignedRoleIds),
    [assignedRoleIds, roles, savedNote, text],
  );
  const [selectedRoleIds, setSelectedRoleIds] = useState(initialRoleIds);
  const [error, setError] = useState('');

  useEffect(() => {
    setSelectedRoleIds(initialRoleIds);
  }, [initialRoleIds]);

  if (!game || !player) {
    return (
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', padding: 20 }}>
        <Stack.Screen options={{ title: 'Note not found' }} />
        <Text selectable style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>
          Note not found.
        </Text>
      </View>
    );
  }

  const legacyRoleIds = roles
    .filter((role) => role.notes?.includes(text.trim()))
    .map((role) => role.id);
  const playerName = player.name;
  const canRemove = !!savedNote || legacyRoleIds.length > 0;
  const noteGameId = game.id;
  const noteScriptId = game.script?.id;

  function handleToggleRole(roleId: string) {
    setSelectedRoleIds((currentRoleIds) =>
      currentRoleIds.includes(roleId)
        ? currentRoleIds.filter((currentRoleId) => currentRoleId !== roleId)
        : [...currentRoleIds, roleId],
    );
  }

  function handleSave() {
    if (
      saveNoteForFutureGames(playerName, selectedRoleIds, text, {
        gameId: noteGameId,
        day: noteDay,
        scriptId: noteScriptId,
      })
    ) {
      router.back();
      return;
    }

    setError('Select at least one role before saving a note for yourself.');
  }

  function handleRemove() {
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
        contentContainerStyle={{ gap: 18, padding: 20, paddingBottom: 40 }}
        style={{ backgroundColor: colors.background, flex: 1 }}
      >
        <NotePreview day={noteDay} playerName={playerName} text={text} />

        {pickerRoles.length > 0 ? (
          <RolePicker
            description="Select every role where this note should appear. Mentioned roles and this player’s claimed or confirmed roles are selected automatically."
            onToggleRole={handleToggleRole}
            roles={pickerRoles}
            selectedFirst
            selectedRoleIds={selectedRoleIds}
          />
        ) : (
          <Text selectable style={{ color: colors.textMuted, fontSize: 15, lineHeight: 21 }}>
            Select a game script before choosing roles for this note.
          </Text>
        )}

        {error ? (
          <Text selectable style={{ color: colors.danger, fontSize: 14 }}>
            {error}
          </Text>
        ) : null}

        <SaveNoteActions canRemove={canRemove} onRemove={handleRemove} onSave={handleSave} />
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

function NotePreview({ day, playerName, text }: { day: number; playerName: string; text: string }) {
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 6,
        padding: 14,
      }}
    >
      <Text selectable style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>
        {playerName} · Day {day}
      </Text>
      <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
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
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <NoteActionButton icon={X} label="No" onPress={() => setConfirmingRemove(false)} />
        <NoteActionButton destructive icon={Trash2} label="Yes" onPress={onRemove} />
      </View>
    );
  }

  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
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
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: destructive
          ? colors.dangerSurface
          : pressed
            ? colors.surfacePressed
            : primary
              ? colors.primary
              : colors.surfaceRaised,
        borderColor: destructive ? '#7f1d1d' : primary ? colors.primary : colors.borderStrong,
        borderRadius: 8,
        borderWidth: 1,
        flex: 1,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 12,
      })}
    >
      <Icon color={foreground} size={17} strokeWidth={2.7} />
      <Text style={{ color: foreground, fontWeight: '800' }}>{label}</Text>
    </Pressable>
  );
}
