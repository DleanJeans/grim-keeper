import { useMemo } from 'react';
import { View } from 'react-native';

import { RoleReferencedNoteText } from '@/components/role-referenced-note-text';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { FriendNote, Game, Player, Role, StoredScript } from '@/types/game';

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
  notes?: FriendNote[];
  playerName: string;
  players: Player[];
  roles: Role[];
  scriptId?: string;
}) {
  const games = useGameStore((state) => state.games);
  const scripts = useGameStore((state) => state.scripts);
  const contexts = useMemo(
    () => buildNoteContexts(notes, games, scripts),
    [games, notes, scripts],
  );

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
        const context = contexts.get(note.id);
        const useOwnOrigin = !!context?.script;
        const noteDay = note.day ?? day;
        const noteRoles: Role[] = context?.script?.roles ?? roles;
        const noteScriptId: string | undefined = context?.script?.id ?? scriptId;
        const notePlayers: Player[] = context?.game?.players ?? players;
        const noteGame: Game = context?.game ?? game;
        return (
          <View key={`${playerName}-saved-note-${note.id}`} style={{ gap: 2 }}>
            <RoleReferencedNoteText
              day={noteDay}
              game={noteGame}
              players={notePlayers}
              roles={noteRoles}
              scriptId={noteScriptId}
              style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
              text={note.text}
            />
            {useOwnOrigin ? (
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
                {context?.label}
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
