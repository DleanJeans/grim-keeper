import { Skull } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KillAttributionPanel } from '@/components/game/deaths-tab/death-actions/kill-attribution-panel';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { Text } from '@/components/text';
import { useGameStore } from '@/store/game-store';
import { colors } from '@/theme/colors';
import type { Player, Role, StoredScript } from '@/types/game';
import { GENERIC_KILLER_ROLES, getRolesByIds } from '@/utils/role-utils';

import { collectLogEntries } from './entries';
import { DeathLogRow, getLogEntryKey } from './row';

type DeathLogProps = {
  activeDay: number;
  players: Player[];
  script?: StoredScript;
};

export function DeathLog({ activeDay, players, script }: DeathLogProps) {
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const { game } = useGameRouteContext();
  const setPlayerDeath = useGameStore((state) => state.setPlayerDeath);
  const entries = collectLogEntries(players, activeDay);
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Skull color={colors.textMuted} size={15} strokeWidth={2.6} />
        <Text selectable style={styles.headerLabel}>
          Death Log
        </Text>
      </View>

      {entries.length === 0 ? (
        <Text selectable style={styles.emptyText}>
          No deaths recorded yet.
        </Text>
      ) : (
        entries.map((entry) => {
          const killerDescription = getKillerDescription(entry, playerById, [
            ...(script?.roles ?? []),
            ...(game.lorics ?? []),
          ]);
          const isEditing = 'death' in entry && editingPlayerId === entry.player.id;

          return (
            <View key={getLogEntryKey(entry)} style={styles.entry}>
              <DeathLogRow
                activeDay={activeDay}
                entry={entry}
                killerDescription={killerDescription}
                onEdit={
                  'death' in entry && entry.death.kind === 'night'
                    ? () => setEditingPlayerId(isEditing ? null : entry.player.id)
                    : undefined
                }
              />
              {isEditing && 'death' in entry ? (
                <KillAttributionPanel
                  confirmLabel="Save Killer"
                  initialAttribution={entry.death}
                  onCancel={() => setEditingPlayerId(null)}
                  onConfirm={(attribution) => {
                    setPlayerDeath(game.id, entry.player.id, {
                      ...entry.death,
                      killerPlayerId: undefined,
                      killerPlayerIds: undefined,
                      ...attribution,
                      updatedAt: new Date().toISOString(),
                    });
                    setEditingPlayerId(null);
                  }}
                  player={entry.player}
                  title="Change killer for"
                />
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  headerLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  entry: {
    gap: 8,
  },
});

function getKillerDescription(
  entry: Parameters<typeof DeathLogRow>[0]['entry'],
  playerById: Map<string, Player>,
  roles: Role[],
) {
  if (!('death' in entry) || entry.death.kind !== 'night') {
    return undefined;
  }

  const killerPlayerIds =
    entry.death.killerPlayerIds ?? (entry.death.killerPlayerId ? [entry.death.killerPlayerId] : []);
  const killerPlayers = killerPlayerIds.flatMap((playerId) => {
    const player = playerById.get(playerId);
    return player ? [player] : [];
  });
  const killerRoles = getRolesByIds(entry.death.killerRoleIds ?? [], [
    ...roles,
    ...GENERIC_KILLER_ROLES,
  ]);

  if (killerPlayers.length === 0 && killerRoles.length === 0) {
    return undefined;
  }

  return { killerPlayers, killerRoles };
}
