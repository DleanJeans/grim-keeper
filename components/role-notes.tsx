import { Trash2 } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote, StoredScript } from '@/types/game';
import { getSavedNoteTextsForRole } from '@/utils/saved-note-utils';

export function RoleNotes({
  compact = false,
  day,
  game,
  games,
  label = false,
  onDeleteNote,
  players,
  role,
  roles,
  scriptId,
  scripts,
}: {
  compact?: boolean;
  day?: number;
  game?: Game;
  games?: Game[];
  label?: boolean;
  onDeleteNote?: (note: string) => void;
  players?: Player[];
  role: Role;
  roles: Role[];
  scriptId?: string;
  scripts?: StoredScript[];
}) {
  const savedNotes = useGameStore((state) => state.savedNotes);
  const notes = [
    ...new Set([...(role.notes ?? []), ...getSavedNoteTextsForRole(savedNotes, role.id)]),
  ];

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
        const context = resolveNoteContext(note, role, savedNotes, games, scripts);
        const contextGame = context?.game ?? game;
        const contextRoles = context?.roles ?? roles;
        const contextScriptId = context?.scriptId ?? scriptId;
        return (
          <View
            key={`${role.id}-note-${note}`}
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
              game={contextGame}
              players={contextGame?.players ?? players}
              roles={contextRoles}
              scriptId={contextScriptId}
              showPlayerRoles
              style={{
                color: colors.textMuted,
                fontSize: compact ? 10 : 13,
                lineHeight: compact ? 13 : 18,
              }}
              text={note}
            />
            {context?.label || onDeleteNote ? (
              <View
                style={{
                  alignItems: 'center',
                  flexDirection: 'row',
                  gap: 10,
                  justifyContent: 'space-between',
                }}
              >
                {context?.label ? (
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
  text: string,
  role: Role,
  savedNotes: SavedNote[],
  games?: Game[],
  scripts?: StoredScript[],
): NoteContext | undefined {
  const matchedNote = savedNotes.find(
    (candidate) => candidate.roleIds.includes(role.id) && candidate.text === text,
  );
  if (!matchedNote) {
    return undefined;
  }
  const game = matchedNote.gameId
    ? games?.find((candidate) => candidate.id === matchedNote.gameId)
    : undefined;
  const script =
    game?.script ??
    (matchedNote.scriptId ? scripts?.find((candidate) => candidate.id === matchedNote.scriptId) : undefined);
  const labelParts: string[] = [];
  if (matchedNote.scriptName) {
    labelParts.push(matchedNote.scriptName);
  } else if (script?.name) {
    labelParts.push(script.name);
  }
  if (game) {
    const formatted = formatGameDate(game.createdAt);
    if (formatted) {
      labelParts.push(formatted);
    }
  }
  if (matchedNote.day) {
    labelParts.push(`Day ${matchedNote.day}`);
  }
  if (!labelParts.length) {
    return undefined;
  }
  return {
    game,
    roles: script?.roles,
    scriptId: matchedNote.scriptId,
    label: labelParts.join(' · '),
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
