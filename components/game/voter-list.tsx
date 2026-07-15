import { Hand } from 'lucide-react-native';
import { View } from 'react-native';

import { PlayerNameWithRole } from '@/components/game/player-name-with-role';
import { Text } from '@/components/text';
import { colors } from '@/theme/colors';
import type { Player } from '@/types/game';

type VoterListProps = {
  players: Player[];
  voterIds: string[];
};

export function VoterList({ players, voterIds }: VoterListProps) {
  const playerById = new Map(players.map((player) => [player.id, player]));

  return (
    <View style={{ alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
      <Hand color={colors.textMuted} size={12} />
      {voterIds.length > 0 ? (
        voterIds.map((playerId) => {
          const player = playerById.get(playerId);

          return player ? (
            <PlayerNameWithRole
              key={player.id}
              bordered
              player={player}
              roleIconSize={14}
              textStyle={{ color: colors.textMuted, fontSize: 14, lineHeight: 20 }}
            />
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
