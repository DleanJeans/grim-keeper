import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote, StoredScript } from '@/types/game';

export function FriendNotes({
  friendId,
  games,
  notes,
  onDeleteNote,
  players,
  roles,
  scripts,
}: {
  friendId: string;
  games: Game[];
  notes?: SavedNote[];
  onDeleteNote?: (note: SavedNote) => void;
  players?: Player[];
  roles?: Role[];
  scripts?: StoredScript[];
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
      {notes.map((note) => {
        const context = resolveNoteContext(note, games, scripts);
        return (
          <View
            key={`${friendId}-note-${note.id}`}
            style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              {context ? (
                <RoleReferencedNoteText
                  day={note.day}
                  game={context.game}
                  players={context.game?.players ?? players}
                  roles={context.roles ?? roles ?? []}
                  scriptId={context.scriptId}
                  style={{ color: colors.textMuted, fontSize: 13, lineHeight: 18 }}
                  text={note.text}
                />
              ) : (
                <Text
                  selectable
                  style={{ color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 18 }}
                >
                  {note.text}
                </Text>
              )}
              {context?.label ? (
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
            {onDeleteNote ? (
              <Pressable
                accessibilityLabel={`Delete note: ${note.text}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => onDeleteNote(note)}
                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 2 })}
              >
                <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
              </Pressable>
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
  games: Game[],
  scripts?: StoredScript[],
): NoteContext | undefined {
  if (!note.gameId && !note.scriptId) {
    return undefined;
  }
  const game = note.gameId
    ? games.find((candidate) => candidate.id === note.gameId)
    : games.find((candidate) => candidate.script?.id === note.scriptId);
  const script = game?.script
    ?? (note.scriptId ? scripts?.find((candidate) => candidate.id === note.scriptId) : undefined);
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
    game,
    roles: script?.roles,
    scriptId: note.scriptId,
    label: labelParts.length ? labelParts.join(' · ') : undefined,
  };
}
