import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote, StoredScript } from '@/types/game';

export function SavedNotes({
  compact = false,
  day,
  games,
  label = false,
  notes,
  onDeleteNote,
  players,
  roles,
  scripts,
}: {
  compact?: boolean;
  day?: number;
  games?: Game[];
  label?: boolean;
  notes: SavedNote[];
  onDeleteNote?: (note: SavedNote) => void;
  players?: Player[];
  roles: Role[];
  scripts?: StoredScript[];
}) {
  if (!notes.length) {
    return null;
  }

  return (
    <View style={{ gap: compact ? 1 : 6 }}>
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
      {notes.map((note) => {
        const context = resolveNoteContext(note, games, scripts);
        return (
          <View
            key={note.id}
            style={{
              backgroundColor: compact ? 'transparent' : colors.surface,
              borderColor: colors.border,
              borderRadius: 8,
              borderWidth: compact ? 0 : 1,
              gap: 6,
              padding: compact ? 0 : 10,
            }}
          >
            <RoleReferencedNoteText
              day={day}
              game={context.game}
              players={context.game?.players ?? players}
              roles={context.roles ?? roles}
              scriptId={context.scriptId}
              showPlayerRoles
              style={{
                color: colors.textMuted,
                fontSize: compact ? 10 : 13,
                lineHeight: compact ? 13 : 18,
              }}
              text={note.text}
            />
            {(context.label || onDeleteNote) ? (
              <View
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 10,
                  justifyContent: 'space-between',
                }}
              >
                {context.label ? (
                  <Text
                    selectable
                    style={{
                      color: colors.textMuted,
                      flex: 1,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 0.4,
                      textTransform: 'uppercase',
                    }}
                  >
                    {context.label}
                  </Text>
                ) : (
                  <View style={{ flex: 1 }} />
                )}
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
  games?: Game[],
  scripts?: StoredScript[],
): NoteContext {
  const game = note.gameId
    ? games?.find((candidate) => candidate.id === note.gameId)
    : undefined;
  const script =
    game?.script ??
    (note.scriptId
      ? scripts?.find((candidate) => candidate.id === note.scriptId)
      : undefined);
  const labelParts: string[] = [];
  if (note.scriptName) {
    labelParts.push(note.scriptName);
  } else if (script?.name) {
    labelParts.push(script.name);
  }
  if (game) {
    const formatted = formatGameDate(game.createdAt);
    if (formatted) {
      labelParts.push(formatted);
    }
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

function formatGameDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  }).format(date);
}
