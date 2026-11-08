import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import type { ScriptRoleNote } from '@/utils/script-utils';

type ScriptRoleInlineNoteProps = {
  note: ScriptRoleNote;
  roles: Role[];
  scriptId?: string;
};

/**
 * One note on a character card, in its own box. Saved notes get a pencil that edits the text in
 * place for every friend who has that note; script and catalog notes can't be edited.
 */
export function ScriptRoleInlineNote({ note, roles, scriptId }: ScriptRoleInlineNoteProps) {
  const updateSavedNote = useGameStore((state) => state.updateSavedNote);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.text);
  const [error, setError] = useState('');
  const editable = note.savedNoteIds.length > 0;

  function handleEdit() {
    setText(note.text);
    setError('');
    setEditing(true);
  }

  function handleSave() {
    if (!text.trim()) {
      setError('Write something before saving.');
      return;
    }
    const savedNotes = useGameStore.getState().savedNotes;
    for (const savedNote of savedNotes) {
      if (note.savedNoteIds.includes(savedNote.id)) {
        updateSavedNote(savedNote.id, {
          playerName: savedNote.playerName,
          roleIds: savedNote.roleIds,
          text,
        });
      }
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <View style={[styles.box, styles.editor]}>
        <TextInput
          accessibilityLabel="Edit note"
          autoFocus
          multiline
          onChangeText={setText}
          placeholderTextColor={colors.inputPlaceholder}
          style={styles.input}
          value={text}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(false)}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]}
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
    <View style={[styles.box, styles.row]}>
      <View style={styles.body}>
        {note.playerNames.length > 0 ? (
          <Text selectable style={styles.player}>
            {note.playerNames.join(', ')}:
          </Text>
        ) : null}
        <RoleReferencedNoteText
          roles={roles}
          scriptId={scriptId}
          style={styles.text}
          text={note.text}
        />
      </View>
      {editable ? (
        <Pressable
          accessibilityLabel={`Edit note: ${note.text}`}
          accessibilityRole="button"
          hitSlop={6}
          onPress={handleEdit}
          style={({ pressed }) => [styles.editButton, pressed && styles.editPressed]}
        >
          <Pencil color={colors.textMuted} size={15} strokeWidth={2.4} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  body: { flex: 1, gap: 2 },
  box: {
    backgroundColor: colors.inputBackground,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cancelButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 12,
  },
  cancelPressed: { backgroundColor: colors.surfacePressed },
  cancelText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  editButton: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  editPressed: { opacity: 0.6 },
  editor: { gap: 8 },
  error: { color: colors.danger, fontSize: 13 },
  input: {
    backgroundColor: colors.surface,
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
  player: { color: colors.text, fontSize: 12, fontWeight: '800' },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: 6 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.saveButton,
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 14,
  },
  saveButtonPressed: { backgroundColor: colors.saveButtonPressed },
  saveText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  text: { color: colors.noteText, fontSize: 13, lineHeight: 18 },
});
