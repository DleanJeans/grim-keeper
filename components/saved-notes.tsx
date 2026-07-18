import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Player, Role, SavedNote, StoredScript } from '@/types/game';
import { normalizePlayerName } from '@/utils/conversation-utils';

export function SavedNotes({
  compact = false,
  day,
  games,
  label = false,
  mode = 'note',
  notes,
  playerName,
  players,
  roleId,
  roles,
  scripts,
}: {
  compact?: boolean;
  day?: number;
  games?: Game[];
  label?: boolean;
  mode?: 'note' | 'role';
  notes: SavedNote[];
  playerName?: string;
  players?: Player[];
  roleId?: string;
  roles: Role[];
  scripts?: StoredScript[];
}) {
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);

  if (!notes.length) {
    return null;
  }

  function handleDeletePress(note: SavedNote) {
    Alert.alert('Delete note?', note.text, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (mode === 'role' && roleId) {
            deleteSavedNote(note, roleId);
          } else {
            deleteSavedNote(note);
          }
        },
      },
    ]);
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
        const context = resolveNoteContext(note, games, scripts, playerName);
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
            <View
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'space-between',
              }}
            >
              {context.label ? (
                <Pressable
                  accessibilityHint="Opens this game at the day this note was written"
                  accessibilityLabel={context.label}
                  accessibilityRole="button"
                  disabled={!context.game || !note.day}
                  onPress={() => {
                    if (!context.game || !note.day) return;
                    const player = context.game.players.find(
                      (candidate) =>
                        normalizePlayerName(candidate.name).toLocaleLowerCase() ===
                        normalizePlayerName(note.playerName).toLocaleLowerCase(),
                    );
                    router.push({
                      params: {
                        day: String(note.day),
                        id: context.game.id,
                        playerId: player?.id,
                        tab: 'notes',
                      },
                      pathname: '/game/[id]',
                    });
                  }}
                  style={({ pressed }) => ({
                    flex: 1,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Text
                    selectable={false}
                    style={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 0.4,
                      textDecorationLine: 'underline',
                      textTransform: 'uppercase',
                    }}
                  >
                    {context.label}
                  </Text>
                </Pressable>
              ) : (
                <View style={{ flex: 1 }} />
              )}
              <Pressable
                accessibilityLabel={`Delete note: ${note.text}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => handleDeletePress(note)}
                style={({ pressed }) => ({ opacity: pressed ? 0.55 : 1, padding: 2 })}
              >
                <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
              </Pressable>
            </View>
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
  friendName?: string,
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
  if (friendName) {
    labelParts.push(friendName);
  } else if (note.playerName) {
    labelParts.push(note.playerName);
  }
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
