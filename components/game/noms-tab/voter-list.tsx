import { Hand } from 'lucide-react-native';
import { View } from 'react-native';

import { DeadVoteIcon } from '@/components/game/dead-vote-icon';
import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';

type VoterListProps = {
  day: number;
  players: Player[];
  voterIds: string[];
};

export function VoterList({ day, players, voterIds }: VoterListProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      <Hand color={colors.textMuted} size={12} />
      {voterIds.length > 0 ? (
        voterIds.map((playerId) => {
          const player = playerById.get(playerId);

          return player ? (
            <View key={player.id} style={{ alignItems: 'center', flexDirection: 'row', gap: 3 }}>
              {isPlayerCurrentlyDead(player, day) ? (
                <DeadVoteIcon color={colors.success} size={13} />
              ) : null}
              <PlayerNameWithRole
                bordered
                player={player}
                iconSize={14}
                textStyle={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
              />
            </View>
          ) : (
            <Text
              key={playerId}
              selectable
              style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
            >
              Unknown
            </Text>
          );
        })
      ) : (
        <Text selectable style={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}>
          No votes recorded
        </Text>
      )}
    </View>
  );
}
