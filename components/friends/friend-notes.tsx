import { Trash2 } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendNote, Game, StoredScript } from '@/types/game';

export function FriendNotes({
  friendId,
  notes,
  onDeleteNote,
}: {
  friendId: string;
  notes?: FriendNote[];
  onDeleteNote?: (note: FriendNote) => void;
}) {
  const games = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const contexts = useMemo(() => buildNoteContexts(notes, games, scripts), [games, notes, scripts]);

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
        const context = contexts.get(note.id);
        return (
          <View
            key={`${friendId}-note-${note.id}`}
            style={{ alignItems: 'flex-start', flexDirection: 'row', gap: 10 }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              {context?.script ? (
                <RoleReferencedNoteText
                  day={note.day}
                  game={context.game}
                  players={context.game?.players}
                  roles={context.script.roles}
                  scriptId={context.script.id}
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
  script?: StoredScript;
  label?: string;
};

function buildNoteContexts(
  notes: FriendNote[] | undefined,
  games: Game[],
  scripts: StoredScript[],
): Map<string, NoteContext> {
  const map = new Map<string, NoteContext>();
  if (!notes?.length) {
    return map;
  }

  const scriptIndex = new Map(scripts.map((script) => [script.id, script]));

  for (const note of notes) {
    if (!note.scriptId) {
      continue;
    }

    const game = note.gameId ? games.find((candidate) => candidate.id === note.gameId) : undefined;
    let script = game?.script;
    if (script?.id !== note.scriptId) {
      script = scriptIndex.get(note.scriptId);
    }
    if (!script) {
      continue;
    }

    const labelParts: string[] = [];
    if (script.name) {
      labelParts.push(script.name);
    }
    if (typeof note.day === 'number') {
      labelParts.push(`Day ${note.day}`);
    }

    map.set(note.id, {
      script,
      game,
      label: labelParts.length ? labelParts.join(' · ') : undefined,
    });
  }

  return map;
}
