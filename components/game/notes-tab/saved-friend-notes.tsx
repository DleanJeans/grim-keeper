import { View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role } from '@/types/game';

export function SavedFriendNotes({
  day,
  game,
  notes,
  playerName,
  players,
  roles,
  scriptId,
}: {
  day: number;
  game: Game;
  notes?: string[];
  playerName: string;
  players: Player[];
  roles: Role[];
  scriptId?: string;
}) {
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
        <RoleReferencedNoteText
          day={day}
          game={game}
          key={`${playerName}-saved-note-${note}`}
          players={players}
          roles={roles}
          scriptId={scriptId}
          style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
          text={note}
        />
      ))}
    </View>
  );
}
