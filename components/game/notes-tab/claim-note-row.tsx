import { Check, Save } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { ClaimNoteDraft } from '@/utils/claim-note-utils';
import { getSavedNote } from '@/utils/saved-note-utils';

type ClaimNoteRowProps = {
  day: number;
  draft: ClaimNoteDraft;
  gameId: string;
  scriptId?: string;
};

/** One claimer's editable note with a button that saves it for future games. */
export function ClaimNoteRow({ day, draft, gameId, scriptId }: ClaimNoteRowProps) {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const saveNoteForFutureGames = useGameStore((state) => state.saveNoteForFutureGames);
  const [text, setText] = useState(draft.text);
  const saved = !!text.trim() && !!getSavedNote(savedNotes, draft.playerName, text);

  function handleSave() {
    saveNoteForFutureGames(draft.playerName, draft.roleIds, text, { day, gameId, scriptId });
  }

  return (
    <View style={styles.row}>
      <View style={styles.body}>
        <Text style={styles.name}>{draft.playerName}</Text>
        <TextInput
          accessibilityLabel={`Note for ${draft.playerName}`}
          multiline
          onChangeText={setText}
          placeholderTextColor={colors.gameTextSubtle}
          style={styles.input}
          value={text}
        />
      </View>
      <Pressable
        accessibilityLabel={
          saved ? `Saved note for ${draft.playerName}` : `Save note for ${draft.playerName}`
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: saved || !text.trim() }}
        disabled={saved || !text.trim()}
        onPress={handleSave}
        style={({ pressed }) => [
          styles.button,
          saved && styles.buttonSaved,
          pressed && styles.buttonPressed,
        ]}
      >
        {saved ? (
          <Check color={colors.success} size={16} strokeWidth={2.6} />
        ) : (
          <Save color={colors.gameText} size={16} strokeWidth={2.4} />
        )}
        <Text style={styles.buttonText}>{saved ? 'Saved' : 'Save'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 2, minWidth: 0 },
  button: {
    alignItems: 'center',
    backgroundColor: colors.gameSurfaceRaised,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  buttonPressed: { backgroundColor: colors.gameSurfacePressed },
  buttonSaved: { backgroundColor: colors.gameSurface },
  buttonText: { color: colors.gameText, fontSize: 13, fontWeight: '800' },
  input: {
    color: colors.gameText,
    fontSize: 14,
    lineHeight: 19,
    minHeight: 22,
    padding: 0,
  },
  name: { color: colors.gameTextSoft, fontSize: 13, fontWeight: '800' },
  row: {
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});
