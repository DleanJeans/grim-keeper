import { View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote, StoredScript } from '@/types/game';

export function SavedFriendNotes({
  game,
  notes,
  playerName,
  players,
  roles,
  scripts,
  scriptId,
}: {
  game: Game;
  notes?: SavedNote[];
  playerName: string;
  players: Player[];
  roles: Role[];
  scripts?: StoredScript[];
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
      {notes.map((note) => {
        const context = resolveNoteContext(note, game, roles, scripts, scriptId);
        return (
          <View key={`${playerName}-saved-note-${note.id}`} style={{ gap: 2 }}>
            <RoleReferencedNoteText
              day={note.day}
              game={context.game ?? game}
              players={context.game?.players ?? players}
              roles={context.roles ?? roles}
              scriptId={context.scriptId ?? scriptId}
              style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
              text={note.text}
            />
            {context.label ? (
              <Text
                selectable
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: '700',
                  letterSpacing: 0.4,
                  textTransform: 'uppercase',
                }}
              >
                {context.label}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

type NoteContext = {
  game?: Game;
  roles?: Role[];
  scriptId?: string;
  label?: string;
};

function resolveNoteContext(
  note: SavedNote,
  fallbackGame: Game,
  fallbackRoles: Role[],
  scripts?: StoredScript[],
  fallbackScriptId?: string,
): NoteContext {
  const script = note.scriptId
    ? (scripts?.find((candidate) => candidate.id === note.scriptId) ?? fallbackGame.script)
    : undefined;
  const labelParts: string[] = [];
  if (note.scriptName) {
    labelParts.push(note.scriptName);
  } else if (script?.name) {
    labelParts.push(script.name);
  }
  if (note.day) {
    labelParts.push(`Day ${note.day}`);
  }
  return {
    game: fallbackGame,
    roles: script?.roles ?? fallbackRoles,
    scriptId: note.scriptId ?? fallbackScriptId,
    label: labelParts.length ? labelParts.join(' · ') : undefined,
  };
}
