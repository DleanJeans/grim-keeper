import { router } from 'expo-router';
import { Pencil, Trash2 } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role, SavedNote } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';
import { findNoteRole } from '@/utils/lesson-utils';
import { detectRoleIdsInNote } from '@/utils/saved-note-utils';

type LessonRowProps = {
  lesson: SavedNote;
  /** The game's script roles, looked up before the catalog. */
  roles?: Role[];
};

/**
 * One saved note with its script and date. The pencil edits the text in place, can untag the
 * player, which keeps the note only for its characters, and picks which character comes first
 * (the one a character-only note is listed under); the trash deletes it after a confirm.
 */
export function LessonRow({ lesson, roles }: LessonRowProps) {
  const showDialog = useAppDialog();
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);
  const updateSavedNote = useGameStore((state) => state.updateSavedNote);
  const roleCatalog = useGameStore((state) => state.roleCatalog);
  const sourceGame = useGameStore((state) =>
    lesson.gameId ? state.games.find((game) => game.id === lesson.gameId) : undefined,
  );
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(lesson.text);
  const [tagPlayer, setTagPlayer] = useState(true);
  const [error, setError] = useState('');
  const [firstRoleId, setFirstRoleId] = useState(lesson.roleIds[0]);
  const playerName = lesson.playerName;
  const noteRoles = useMemo(
    () => getNoteRoles(lesson.roleIds, roles ?? [], roleCatalog),
    [lesson.roleIds, roleCatalog, roles],
  );

  function handleEdit() {
    setText(lesson.text);
    setTagPlayer(true);
    setFirstRoleId(lesson.roleIds[0]);
    setError('');
    setEditing(true);
  }

  function handleSave() {
    const roleIds =
      tagPlayer || lesson.roleIds.length > 0
        ? [firstRoleId, ...lesson.roleIds.filter((roleId) => roleId !== firstRoleId)]
        : detectRoleIdsInNote(text, roleCatalog);
    if (updateSavedNote(lesson.id, { playerName: tagPlayer ? playerName : '', roleIds, text })) {
      setEditing(false);
      return;
    }
    setError(
      text.trim()
        ? `Name a character in the note to keep it without ${playerName}.`
        : 'Write something before saving.',
    );
  }

  function handleOpenGame() {
    if (!sourceGame) return;
    const playerKey = normalizePlayerName(lesson.playerName).toLocaleLowerCase();
    const player = playerKey
      ? sourceGame.players.find(
          (candidate) => normalizePlayerName(candidate.name).toLocaleLowerCase() === playerKey,
        )
      : undefined;
    router.push({
      params: {
        day: lesson.day ? String(lesson.day) : undefined,
        id: sourceGame.id,
        playerId: player?.id,
        tab: 'notes',
      },
      pathname: '/game/[id]',
    });
  }

  function handleDelete() {
    showDialog('Delete note?', lesson.text, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteSavedNote(lesson) },
    ]);
  }

  if (editing) {
    return (
      <View style={styles.editor}>
        <TextInput
          accessibilityLabel="Edit note"
          autoFocus
          multiline
          onChangeText={setText}
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          value={text}
        />
        {playerName ? (
          <View style={styles.tagRow}>
            <Text style={styles.tagText}>
              {tagPlayer
                ? `Tagged: ${playerName}`
                : `Untagged: only about the character, not ${playerName}`}
            </Text>
            <Switch
              accessibilityLabel={`Tag ${playerName} in this note`}
              accessibilityRole="switch"
              accessibilityState={{ checked: tagPlayer }}
              onValueChange={setTagPlayer}
              thumbColor={tagPlayer ? colors.primary : colors.onDisabled}
              trackColor={{ false: colors.disabled, true: colors.borderStrong }}
              value={tagPlayer}
            />
          </View>
        ) : null}
        {noteRoles.length > 1 ? (
          <View style={styles.firstRole}>
            <Text style={styles.tagText}>Listed under</Text>
            <View style={styles.roleChips}>
              {noteRoles.map(({ id, role }) => (
                <RoleChip
                  key={id}
                  name={role?.name ?? id}
                  onPress={() => setFirstRoleId(id)}
                  role={role}
                  selected={id === firstRoleId}
                />
              ))}
            </View>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(false)}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.lesson}>
      <View style={styles.body}>
        <Text selectable style={styles.text}>
          {lesson.text}
        </Text>
        {sourceGame ? (
          <Pressable
            accessibilityHint="Opens the game this note came from"
            accessibilityRole="link"
            hitSlop={4}
            onPress={handleOpenGame}
            style={({ pressed }) => [styles.source, pressed && styles.iconButtonPressed]}
          >
            <Text style={[styles.meta, styles.metaLink]}>{getLessonSource(lesson)}</Text>
          </Pressable>
        ) : (
          <Text style={styles.meta}>{getLessonSource(lesson)}</Text>
        )}
      </View>
      <Pressable
        accessibilityLabel={`Edit note: ${lesson.text}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleEdit}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
      >
        <Pencil color={colors.gameTextMuted} size={16} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityLabel={`Delete note: ${lesson.text}`}
        accessibilityRole="button"
        hitSlop={6}
        onPress={handleDelete}
        style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
      >
        <Trash2 color={colors.gameTextMuted} size={16} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

type NoteRole = { id: string; role?: Role };

/** The note's characters in its own order, looked up in the script first, then the catalog. */
function getNoteRoles(roleIds: string[], scriptRoles: Role[], roleCatalog: Role[]): NoteRole[] {
  return roleIds.map((id) => ({ id, role: findNoteRole(id, scriptRoles, roleCatalog) }));
}

function RoleChip({
  name,
  onPress,
  role,
  selected,
}: {
  name: string;
  onPress: () => void;
  role?: Role;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityLabel={`List under ${name}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleChip,
        styles.roleChipButton,
        selected && styles.roleChipSelected,
        pressed && styles.iconButtonPressed,
      ]}
    >
      {role ? <RoleIcon role={role} size={16} /> : null}
      <Text style={[styles.roleChipText, selected && styles.roleChipTextSelected]}>{name}</Text>
    </Pressable>
  );
}

function getLessonSource(lesson: SavedNote) {
  const date = new Date(lesson.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
  return lesson.scriptName ? `${lesson.scriptName} · ${date}` : date;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  body: { flex: 1, gap: 1 },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  cancelText: { color: colors.gameTextMuted, fontSize: 14, fontWeight: '700' },
  editor: { alignSelf: 'stretch', gap: 8 },
  error: { color: colors.danger, fontSize: 13 },
  firstRole: { gap: 6 },
  iconButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  iconButtonPressed: { opacity: 0.6 },
  input: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.inputText,
    fontSize: 14,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  lesson: { alignItems: 'flex-start', flexDirection: 'row', gap: 4 },
  meta: { color: colors.gameTextSubtle, fontSize: 12 },
  metaLink: { textDecorationLine: 'underline' },
  roleChip: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 2,
  },
  roleChipButton: {
    borderColor: colors.gameBorder,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  roleChipSelected: { borderColor: colors.savedNoteIcon },
  roleChipText: { color: colors.gameTextSoft, fontSize: 12, fontWeight: '700' },
  roleChipTextSelected: { color: colors.savedNoteIcon },
  roleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.saveButton,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  saveButtonPressed: { backgroundColor: colors.saveButtonPressed },
  saveText: { color: colors.gameText, fontSize: 14, fontWeight: '800' },
  source: { alignSelf: 'flex-start' },
  tagRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  tagText: { color: colors.gameTextSoft, flex: 1, fontSize: 13 },
  text: { color: colors.noteText, fontSize: 14, lineHeight: 19 },
});
