import { type StyleProp, type TextStyle, View } from 'react-native';
import { RoleReferenceNoteLine } from '@/components/role-reference-note-line';
import { useGameStore } from '@/store/game-store';
import type { Game, Player, Role } from '@/types/game';
import { GENERIC_CHARACTER_TYPE_ROLE_REFERENCES } from '@/utils/role-utils';

export function RoleReferencedNoteText({
  day,
  game,
  players,
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
  const lineOccurrences = new Map<string, number>();
  const lines = text.split('\n').map((line) => {
    const occurrence = (lineOccurrences.get(line) ?? 0) + 1;
    lineOccurrences.set(line, occurrence);
    return { key: `${line}-${occurrence}`, text: line };
  });

  return (
    <View style={{ flexShrink: 1, gap: 0 }}>
      {lines.map((line) => (
        <RoleReferenceNoteLine
          key={line.key}
          day={day}
          game={game}
          players={referencedPlayers}
          roles={referencedRoles}
          scriptId={scriptId}
          showPlayerRoles={showPlayerRoles}
          style={style}
          text={line.text}
        />
      ))}
    </View>
  );
}
