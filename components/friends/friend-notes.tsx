import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';

export function FriendNotes({
  friendId,
  notes,
  onDeleteNote,
}: {
  friendId: string;
  notes?: string[];
  onDeleteNote?: (note: string) => void;
}) {
  if (!notes?.length) {
    return null;
  }

  return (
    <View style={{ gap: 3 }}>
      <Text
        selectable
        style={{
          color: colors.textMuted,
          fontSize: 11,
          fontWeight: '900',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        Notes
      </Text>
      {notes.map((note) => (
        <View
          key={`${friendId}-note-${note}`}
          style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}
        >
          <Text
            selectable
            style={{ color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 18 }}
          >
            {note}
          </Text>
          {onDeleteNote ? (
            <Pressable
              accessibilityLabel={`Delete note: ${note}`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => onDeleteNote(note)}
              style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 2 })}
            >
              <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}
