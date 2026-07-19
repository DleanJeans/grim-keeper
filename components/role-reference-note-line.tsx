import { Pencil } from 'lucide-react-native';
import { type ReactNode, useState } from 'react';
import {
  type LayoutChangeEvent,
  Pressable,
  type StyleProp,
  StyleSheet,
  type TextStyle,
  View,
} from 'react-native';

import { SaveNoteForFutureButton } from '@/components/game/notes-tab/save-note-for-future-button';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { gameStyles } from '@/components/game/styles';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Player, Role } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';
import { getPlayerNameMatches, getRoleNameMatches } from '@/utils/saved-note-utils';

const SINGLE_LINE_CONTENT_HEIGHT = 24;

export function RoleReferenceNoteLine({
  day,
  game,
  onEdit,
  playerId,
  playerName,
  players = [],
  roles,
  scriptId,
  showPlayerRoles,
  style,
  text,
}: {
  day?: number;
  game?: Game;
  onEdit?: () => void;
  playerId?: string;
  playerName?: string;
  players?: Player[];
  roles: Role[];
  scriptId?: string;
  showPlayerRoles?: boolean;
  style?: StyleProp<TextStyle>;
  text: string;
}) {
  const [wrappedText, setWrappedText] = useState<string | null>(null);
  const friends = useGameStore((state) => state.friends);
  const contentWrapped = wrappedText === text;
  const referencedPlayers = [
    ...new Map(
      [
        ...friends.map((friend) => ({ id: friend.id, name: friend.name, seat: -1 })),
        ...(players ?? []),
      ].map((player) => [player.name.trim().toLocaleLowerCase(), player]),
    ).values(),
  ];
  const referencedRoles = [
    ...new Map(
      [...GENERIC_CHARACTER_TYPE_ROLE_REFERENCES, ...roles].map((role) => [
        role.name.trim().toLocaleLowerCase(),
        role,
      ]),
    ).values(),
  ];
  const candidates = [
    ...getRoleNameMatches(text, referencedRoles).map((match) => ({
      ...match,
      kind: 'role' as const,
    })),
    ...getPlayerNameMatches(text, referencedPlayers).map((match) => ({
      ...match,
      kind: 'player' as const,
    })),
  ].sort((a, b) => a.start - b.start || b.end - a.start - (a.end - a.start));
  const matches: typeof candidates = [];
  for (const candidate of candidates) {
    if (!matches.length || candidate.start >= matches[matches.length - 1].end) {
      matches.push(candidate);
    }
  }
  const parts: ReactNode[] = [];
  const hasActions = !!onEdit || (day !== undefined && !!playerId && !!playerName);
  const leadingSpace = /^[\t ]+/.exec(text)?.[0] ?? '';
  const body = text.slice(leadingSpace.length);
  let bodyCursor = 0;

  for (const match of matches) {
    if (match.start > leadingSpace.length + bodyCursor) {
      parts.push(
        ...getPlainTextParts(
          body.slice(bodyCursor, match.start - leadingSpace.length),
          `text-${bodyCursor}`,
          style,
        ),
      );
    }
    parts.push(
      match.kind === 'role' ? (
        <RoleReference
          key={`role-${match.role.id}-${match.start}`}
          role={match.role}
          scriptId={scriptId}
          textStyle={[{ fontSize: 13 }, style]}
          iconScale={1}
        />
      ) : (
        <PlayerNameWithRole
          day={day}
          game={game}
          key={`player-${match.player.id}-${match.start}`}
          player={match.player}
          roleIconSize={16}
          showRoles={showPlayerRoles}
          textStyle={[{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }, style]}
        />
      ),
    );
    bodyCursor = match.end - leadingSpace.length;
  }

  if (bodyCursor < body.length || parts.length === 0) {
    parts.push(...getPlainTextParts(body.slice(bodyCursor) || ' ', `text-${bodyCursor}`, style));
  }

  function handleContentLayout(event: LayoutChangeEvent) {
    if (event.nativeEvent.layout.height > SINGLE_LINE_CONTENT_HEIGHT) {
      setWrappedText(text);
    }
  }

  return (
    <View style={[styles.line, hasActions && gameStyles.noteCard]}>
      <View onLayout={handleContentLayout} style={styles.content}>
        {parts}
      </View>
      {hasActions ? (
        <View style={[styles.actions, contentWrapped && styles.actionsStacked]}>
          {onEdit ? (
            <Pressable
              accessibilityLabel="Edit note"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onEdit}
              style={styles.actionButton}
            >
              <Pencil color={colors.textMuted} size={14} strokeWidth={2.5} />
            </Pressable>
          ) : null}
          {day !== undefined && playerId && playerName ? (
            <SaveNoteForFutureButton
              day={day}
              disabled={!text.trim()}
              playerId={playerId}
              playerName={playerName}
              text={text}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    borderRadius: 6,
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionsStacked: {
    flexDirection: 'column',
  },
  bullet: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 16,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  line: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  lineBreak: {
    height: 0,
    width: '100%',
  },
  plainText: {
    color: colors.textMuted,
  },
});

function getPlainTextParts(
  text: string,
  keyPrefix: string,
  style: StyleProp<TextStyle>,
): ReactNode[] {
  const parts: ReactNode[] = [];
  const lines = text.split('\n');
  let offset = 0;

  for (const line of lines) {
    if (line) {
      parts.push(
        <Text key={`${keyPrefix}-${offset}`} selectable style={[styles.plainText, style]}>
          {line}
        </Text>,
      );
    }
    offset += line.length;
    if (offset < text.length) {
      parts.push(<View key={`${keyPrefix}-break-${offset}`} style={styles.lineBreak} />);
      offset += 1;
    }
  }

  return parts;
}
