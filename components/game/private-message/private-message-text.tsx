import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { RoleIcon } from '@/components/role-icon';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, Role } from '@/types/game';
import { getPrivateMessageLines, type PrivateMessagePiece } from '@/utils/private-message-utils';

const EVIL_TEAMS = new Set(['minion', 'demon']);

type PrivateMessageTextProps = {
  fontSize: number;
  players: Player[];
  roles: Role[];
  text: string;
};

/**
 * A private message in big centred text. Role names become chips with the character icon and
 * player names become dashed chips; both grow with the font size. Players never show a role.
 */
export function PrivateMessageText({ fontSize, players, roles, text }: PrivateMessageTextProps) {
  const lines = useMemo(() => getPrivateMessageLines(text, roles, players), [players, roles, text]);
  const sizeStyles = useMemo(() => getSizeStyles(fontSize), [fontSize]);

  return (
    <View style={styles.root}>
      {lines.map((groups, lineIndex) => (
        // Lines have no id and never reorder while shown.
        // biome-ignore lint/suspicious/noArrayIndexKey: see above
        <View key={lineIndex} style={[styles.line, sizeStyles.line]}>
          {groups.length === 0 ? <Text style={[styles.text, sizeStyles.text]}> </Text> : null}
          {groups.map((pieces, groupIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: see above
            <View key={groupIndex} style={styles.group}>
              {pieces.map((piece, pieceIndex) => (
                <MessagePiece
                  fontSize={fontSize}
                  // biome-ignore lint/suspicious/noArrayIndexKey: see above
                  key={pieceIndex}
                  piece={piece}
                  sizeStyles={sizeStyles}
                />
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'stretch', gap: 4 },
  line: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  group: { alignItems: 'center', flexDirection: 'row' },
  text: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  chip: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.borderStrong,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
  },
  goodChip: { borderColor: colors.teamGood },
  evilChip: { borderColor: colors.teamEvil },
  playerChip: { borderStyle: 'dashed' },
  initial: { alignItems: 'center', backgroundColor: colors.primary, justifyContent: 'center' },
  initialText: { color: colors.onPrimary, fontWeight: '900' },
});

function MessagePiece({
  fontSize,
  piece,
  sizeStyles,
}: {
  fontSize: number;
  piece: PrivateMessagePiece;
  sizeStyles: ReturnType<typeof getSizeStyles>;
}) {
  if (piece.kind === 'text') {
    return <Text style={[styles.text, sizeStyles.text]}>{piece.text}</Text>;
  }
  if (piece.kind === 'role') {
    const teamStyle = piece.role.team
      ? EVIL_TEAMS.has(piece.role.team)
        ? styles.evilChip
        : styles.goodChip
      : null;
    return (
      <View style={[styles.chip, teamStyle, sizeStyles.chip]}>
        <RoleIcon role={piece.role} scale={1.45} size={Math.round(fontSize * 1.05)} />
        <Text style={[styles.text, sizeStyles.text]}>{piece.role.name}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.chip, styles.playerChip, sizeStyles.chip]}>
      <View style={[styles.initial, sizeStyles.initial]}>
        <Text style={[styles.initialText, sizeStyles.initialText]}>
          {piece.player.name.trim().charAt(0).toLocaleUpperCase()}
        </Text>
      </View>
      <Text style={[styles.text, sizeStyles.text]}>{piece.player.name}</Text>
    </View>
  );
}

function getSizeStyles(fontSize: number) {
  const initialSize = Math.round(fontSize * 0.95);
  return StyleSheet.create({
    chip: {
      gap: Math.round(fontSize * 0.18),
      marginVertical: Math.round(fontSize * 0.06),
      paddingLeft: Math.round(fontSize * 0.14),
      paddingRight: Math.round(fontSize * 0.4),
      paddingVertical: Math.round(fontSize * 0.06),
    },
    initial: {
      borderRadius: Math.round(initialSize * 0.3),
      height: initialSize,
      width: initialSize,
    },
    initialText: { fontSize: Math.round(fontSize * 0.58), lineHeight: Math.round(fontSize * 0.7) },
    line: { columnGap: Math.round(fontSize * 0.28) },
    text: { fontSize, lineHeight: Math.round(fontSize * 1.3) },
  });
}
