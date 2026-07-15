import { Skull } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player, StoredScript } from '@/types/game';
import { getRolesByIds } from '@/utils/role-utils';

import { collectLogEntries } from './entries';
import { DeathLogRow, getLogEntryKey } from './row';

type DeathLogProps = {
  activeDay: number;
  players: Player[];
  script?: StoredScript;
};

export function DeathLog({ activeDay, players, script }: DeathLogProps) {
  const entries = collectLogEntries(players, activeDay);
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderRadius: 8,
        borderWidth: 1,
        gap: 10,
        padding: 12,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          flexDirection: 'row',
          gap: 6,
        }}
      >
        <Skull color={colors.textMuted} size={15} strokeWidth={2.6} />
        <Text
          selectable
          style={{
            color: colors.textMuted,
            fontSize: 13,
            fontWeight: '900',
            letterSpacing: 0.6,
            textTransform: 'uppercase',
          }}
        >
          Death Log
        </Text>
      </View>

      {entries.length === 0 ? (
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
          No deaths recorded yet.
        </Text>
      ) : (
        entries.map((entry) => {
          const killerDescription = getKillerDescription(entry, playerById, script);

          return (
            <DeathLogRow
              activeDay={activeDay}
              entry={entry}
              key={getLogEntryKey(entry)}
              killerDescription={killerDescription}
            />
          );
        })
      )}
    </View>
  );
}

function getKillerDescription(
  entry: Parameters<typeof DeathLogRow>[0]['entry'],
  playerById: Map<string, Player>,
  script: StoredScript | undefined,
) {
  if (!('death' in entry) || entry.death.kind !== 'night') {
    return undefined;
  }

  const killerPlayerIds =
    entry.death.killerPlayerIds ?? (entry.death.killerPlayerId ? [entry.death.killerPlayerId] : []);
  const killerNames = killerPlayerIds.flatMap((playerId) => {
    const playerName = playerById.get(playerId)?.name;
    return playerName ? [playerName] : [];
  });
  const killerRoles = getRolesByIds(entry.death.killerRoleIds ?? [], script?.roles ?? []);

  if (killerNames.length === 0 && killerRoles.length === 0) {
    return undefined;
  }

  return { killerNames, killerRoles };
}
