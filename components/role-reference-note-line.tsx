import type { ReactNode } from 'react';
import { type StyleProp, type TextStyle, View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { RoleReference } from '@/components/role-reference';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Game, Player, Role } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';
import { getPlayerNameMatches, getRoleNameMatches } from '@/utils/saved-note-utils';

export function RoleReferenceNoteLine({
  day,
  game,
  players = [],
  roles,
  scriptId,
  showPlayerRoles,
  style,
  text,
}: {
  day?: number;
  game?: Game;
  players?: Player[];
  roles: Role[];
  scriptId?: string;
  showPlayerRoles?: boolean;
  style?: StyleProp<TextStyle>;
  text: string;
}) {
  const friends = useGameStore((state) => state.friends);
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
    ...getRoleNameMatches(text, roles).map((match) => ({ ...match, kind: 'role' as const })),
    ...getPlayerNameMatches(text, players).map((match) => ({ ...match, kind: 'player' as const })),
  ].sort((a, b) => a.start - b.start || b.end - a.start - (a.end - a.start));
  const matches: typeof candidates = [];
  for (const candidate of candidates) {
    if (!matches.length || candidate.start >= matches[matches.length - 1].end) {
      matches.push(candidate);
    }
  }
  const parts: ReactNode[] = [];
  const leadingSpace = /^\s+/.exec(text)?.[0] ?? '';
  const body = text.slice(leadingSpace.length);
  let bodyCursor = 0;

  for (const match of matches) {
    if (match.start > leadingSpace.length + bodyCursor) {
      parts.push(
        <Text key={`text-${bodyCursor}`} selectable style={[{ color: colors.textMuted }, style]}>
          {body.slice(bodyCursor, match.start - leadingSpace.length)}
        </Text>,
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
    parts.push(
      <Text key={`text-${bodyCursor}`} selectable style={[{ color: colors.textMuted }, style]}>
        {body.slice(bodyCursor) || ' '}
      </Text>,
    );
  }

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      <Text selectable style={{ color: colors.textMuted, fontSize: 16, lineHeight: 16 }}>
        •
      </Text>
      {parts}
    </View>
  );
}
