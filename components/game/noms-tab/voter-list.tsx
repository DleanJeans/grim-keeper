import { Hand } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { isDeadBanshee, isDeadVote } from '@/utils/player-utils';

type VoterListProps = {
  day: number;
  players: Player[];
  voterIds: string[];
};

export function VoterList({ day, players, voterIds }: VoterListProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <View style={styles.list}>
      <Hand color={colors.textMuted} size={12} />
      {voterIds.length > 0 ? (
        voterIds.map((playerId) => {
          const player = playerById.get(playerId);

          return player ? (
            <PlayerNameWithRole
              key={player.id}
              bordered
              trailing={
                isDeadBanshee(player, day) ? (
                  <Text style={styles.double}>×2</Text>
                ) : isDeadVote(player, day) ? (
                  <DeadVoteIcon color={colors.success} size={13} />
                ) : null
              }
              player={player}
              iconSize={14}
              textStyle={styles.text}
            />
          ) : (
            <Text key={playerId} selectable style={styles.text}>
              Unknown
            </Text>
          );
        })
      ) : (
        <Text selectable style={styles.text}>
          No votes recorded
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  double: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  list: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
