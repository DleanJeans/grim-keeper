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
import type { Game, GamePhase, Player, Role } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';
import { getPlayerNameMatches, getRoleNameMatches } from '@/utils/saved-note-utils';

const SINGLE_LINE_CONTENT_HEIGHT = 24;

export function RoleReferenceNoteLine({
  day,
  phase,
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
  phase?: GamePhase;
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
  const tokens: NoteToken[] = [];
  const hasActions = !!onEdit || (day !== undefined && !!playerId && !!playerName);
  const leadingSpace = /^[\t ]+/.exec(text)?.[0] ?? '';
  const body = text.slice(leadingSpace.length);
  let bodyCursor = 0;

  for (const match of matches) {
    const before = body.slice(bodyCursor, match.start - leadingSpace.length);
    if (before) {
      tokens.push(...getPlainTextTokens(before, `text-${bodyCursor}`, style));
    }
    tokens.push({
      key: `${match.kind}-${match.start}`,
      node:
        match.kind === 'role' ? (
          <RoleReference
            key={`role-${match.role.id}-${match.start}`}
            role={match.role}
            scriptId={scriptId}
            textStyle={style}
            variant="note"
          />
        ) : (
          <PlayerNameWithRole
            day={day}
            phase={phase}
            game={game}
            key={`player-${match.player.id}-${match.start}`}
            player={match.player}
            showRoles={showPlayerRoles}
            textStyle={[styles.playerReferenceText, style]}
            variant="note"
          />
        ),
      spaceBefore: tokens.length === 0 || /\s$/.test(before) || (!before && bodyCursor === 0),
    });
    bodyCursor = match.end - leadingSpace.length;
  }

  if (bodyCursor < body.length || tokens.length === 0) {
    tokens.push(...getPlainTextTokens(body.slice(bodyCursor) || ' ', `text-${bodyCursor}`, style));
  }
  const parts = groupTokens(tokens);

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
  joined: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  lineBreak: {
    height: 0,
    width: '100%',
  },
  plainText: {
    color: colors.textMuted,
  },
  playerReferenceText: {
    color: colors.textMuted,
    fontWeight: '700',
  },
});

type NoteToken = {
  /** Forces the next token onto a new line. */
  lineBreak?: boolean;
  key: string;
  node: ReactNode;
  /** False when the token sits right against the one before it, like the comma in "Imp,". */
  spaceBefore: boolean;
};

/**
 * Splits plain text into one token per word so it wraps word by word next to role and player
 * references instead of jumping to a new line as one block.
 */
function getPlainTextTokens(
  text: string,
  keyPrefix: string,
  style: StyleProp<TextStyle>,
): NoteToken[] {
  const tokens: NoteToken[] = [];
  const lines = text.split('\n');
  let offset = 0;

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      tokens.push({
        key: `${keyPrefix}-break-${offset}`,
        lineBreak: true,
        node: <View key={`${keyPrefix}-break-${offset}`} style={styles.lineBreak} />,
        spaceBefore: true,
      });
    }
    const wordPattern = /\S+/g;
    let word = wordPattern.exec(line);
    while (word) {
      const key = `${keyPrefix}-${offset + word.index}`;
      tokens.push({
        key,
        node: (
          <Text key={key} selectable style={[styles.plainText, style]}>
            {word[0]}
          </Text>
        ),
        spaceBefore: word.index > 0 || lineIndex > 0,
      });
      word = wordPattern.exec(line);
    }
    offset += line.length + 1;
  });

  return tokens;
}

/** Keeps tokens with no space between them together, so punctuation never wraps on its own. */
function groupTokens(tokens: NoteToken[]): ReactNode[] {
  const groups: NoteToken[][] = [];
  for (const token of tokens) {
    const last = groups[groups.length - 1];
    const previous = last?.[last.length - 1];
    if (last && !token.spaceBefore && !token.lineBreak && !previous?.lineBreak) {
      last.push(token);
    } else {
      groups.push([token]);
    }
  }
  return groups.map((group) =>
    group.length === 1 ? (
      group[0].node
    ) : (
      <View key={`group-${group[0].key}`} style={styles.joined}>
        {group.map((token) => token.node)}
      </View>
    ),
  );
}
