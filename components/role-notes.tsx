import { View } from 'react-native';

import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

export function RoleNotes({
  role,
  compact = false,
  label = false,
}: {
  compact?: boolean;
  label?: boolean;
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
        <Text
          key={`${role.id}-note-${note}`}
          selectable
          style={{
            color: colors.textMuted,
            fontSize: compact ? 10 : 13,
            lineHeight: compact ? 13 : 18,
          }}
        >
          {note}
        </Text>
      ))}
    </View>
  );
}
