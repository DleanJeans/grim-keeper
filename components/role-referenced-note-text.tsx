import type { ReactNode } from 'react';
import { type StyleProp, type TextStyle, View } from 'react-native';

import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Role } from '@/types/game';
import { getRoleNameMatches } from '@/utils/saved-note-utils';

export function RoleReferencedNoteText({
  roles,
  scriptId,
  style,
  text,
}: {
  roles: Role[];
  scriptId?: string;
  style?: StyleProp<TextStyle>;
  text: string;
}) {
  const lineOccurrences = new Map<string, number>();
  const lines = text.split('\n').map((line) => {
    const occurrence = (lineOccurrences.get(line) ?? 0) + 1;
    lineOccurrences.set(line, occurrence);
    return { key: `${line}-${occurrence}`, text: line };
  });

  return (
    <View style={{ flexShrink: 1, gap: 0 }}>
      {lines.map((line) => (
        <RoleReferencedNoteLine
          key={line.key}
          roles={roles}
          scriptId={scriptId}
          style={style}
          text={line.text}
        />
      ))}
    </View>
  );
}

function RoleReferencedNoteLine({
  roles,
  scriptId,
  style,
  text,
}: {
  roles: Role[];
  scriptId?: string;
  style?: StyleProp<TextStyle>;
  text: string;
}) {
  const matches = getRoleNameMatches(text, roles);
  const parts: ReactNode[] = [];
  let cursor = 0;

  for (const match of matches) {
    if (match.start > cursor) {
      parts.push(
        <Text key={`text-${cursor}`} selectable style={[{ color: colors.textMuted }, style]}>
          {text.slice(cursor, match.start)}
        </Text>,
      );
    }
    parts.push(
      <RoleReference
        iconSize={16}
        key={`role-${match.role.id}-${match.start}`}
        role={match.role}
        scriptId={scriptId}
        textStyle={[{ fontSize: 13 }, style]}
      />,
    );
    cursor = match.end;
  }

  if (cursor < text.length || parts.length === 0) {
    parts.push(
      <Text key={`text-${cursor}`} selectable style={[{ color: colors.textMuted }, style]}>
        {text.slice(cursor) || ' '}
      </Text>,
    );
  }

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap' }}>{parts}</View>
  );
}
