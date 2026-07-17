import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

export function RoleNotes({
  role,
  compact = false,
  label = false,
  onDeleteNote,
}: {
  compact?: boolean;
  label?: boolean;
  onDeleteNote?: (note: string) => void;
  role: Role;
}) {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const notes = [
    ...new Set([...(role.notes ?? []), ...getSavedNoteTextsForRole(savedNotes, role.id)]),
  ];

  if (!notes.length) {
    return null;
  }

  return (
    <View style={{ gap: compact ? 1 : 4 }}>
      {label ? (
        <Text
          selectable
          style={{
            color: colors.textMuted,
            fontSize: compact ? 10 : 12,
            fontWeight: '900',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
          }}
        >
          Notes
        </Text>
      ) : null}
      {notes.map((note) => (
        <View
          key={`${role.id}-note-${note}`}
          style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}
        >
          <Text
            selectable
            style={{
              color: colors.textMuted,
              flex: 1,
              fontSize: compact ? 10 : 13,
              lineHeight: compact ? 13 : 18,
            }}
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
