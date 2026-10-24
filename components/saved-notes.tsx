import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { useAppDialog } from '@/components/dialog/app-dialog-provider';
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
  players?: Player[];
  roleId?: string;
  roles: Role[];
  scripts?: StoredScript[];
}) {
  const showDialog = useAppDialog();
  const deleteSavedNote = useGameStore((state) => state.deleteSavedNote);

  if (!notes.length) {
    return null;
  }

  function handleDeletePress(note: SavedNote) {
    showDialog('Delete note?', note.text, [
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
    <View style={[styles.list, compact && styles.listCompact]}>
      {label ? (
        <Text selectable style={[styles.label, compact && styles.labelCompact]}>
          Notes
        </Text>
      ) : null}
      {notes.map((note) => (
        <SavedNoteCard
          compact={compact}
          context={resolveNoteContext(note, games, scripts, mode)}
          day={day}
          key={note.id}
          note={note}
          onDelete={handleDeletePress}
          players={players}
          roles={roles}
        />
      ))}
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
  mode: 'note' | 'role' = 'note',
): NoteContext {
  const game = note.gameId ? games?.find((candidate) => candidate.id === note.gameId) : undefined;
  const script =
    game?.script ??
    (note.scriptId ? scripts?.find((candidate) => candidate.id === note.scriptId) : undefined);
  const labelParts: string[] = [];
  if (mode === 'role' && note.playerName) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  cardCompact: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  contextButton: {
    flex: 1,
  },
  contextButtonPressed: {
    opacity: 0.6,
  },
  contextLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textDecorationLine: 'underline',
    textTransform: 'uppercase',
  },
  deleteButton: {
    padding: 2,
  },
  deleteButtonPressed: {
    opacity: 0.55,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  footerSpacer: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  labelCompact: {
    fontSize: 10,
  },
  list: {
    gap: 6,
  },
  listCompact: {
    gap: 1,
  },
  noteText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  noteTextCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
});

function SavedNoteCard({
  compact,
  context,
  day,
  note,
  onDelete,
  players,
  roles,
}: {
  compact: boolean;
  context: NoteContext;
  day?: number;
  note: SavedNote;
  onDelete: (note: SavedNote) => void;
  players?: Player[];
  roles: Role[];
}) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <RoleReferencedNoteText
        day={day}
        game={context.game}
        players={context.game?.players ?? players}
        roles={context.roles ?? roles}
        scriptId={context.scriptId}
        showPlayerRoles
        style={[styles.noteText, compact && styles.noteTextCompact]}
        text={note.text}
      />
      <View style={styles.footer}>
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
            style={({ pressed }) => [styles.contextButton, pressed && styles.contextButtonPressed]}
          >
            <Text selectable={false} style={styles.contextLabel}>
              {context.label}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.footerSpacer} />
        )}
        <Pressable
          accessibilityLabel={`Delete note: ${note.text}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onDelete(note)}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        >
          <Trash2 color={colors.danger} size={16} strokeWidth={2.4} />
        </Pressable>
      </View>
    </View>
  );
}
