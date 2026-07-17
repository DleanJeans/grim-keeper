import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function SavedFriendNotes({ notes, playerName }: { notes?: string[]; playerName: string }) {
  if (!notes?.length) {
    return null;
  }

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 8,
        padding: 12,
      }}
    >
      <Text
        selectable
        style={{
          color: colors.text,
          fontSize: 13,
          fontWeight: '900',
          letterSpacing: 0.3,
        }}
      >
        Saved notes for {playerName}
      </Text>
      {notes.map((note) => (
        <Text
          key={`${playerName}-saved-note-${note}`}
          selectable
          style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
        >
          {note}
        </Text>
      ))}
    </View>
  );
}
