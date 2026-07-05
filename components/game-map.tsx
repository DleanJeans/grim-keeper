import { View } from 'react-native';

import { PlayerToken } from '@/components/player-token';
import type { Player, PlayerPosition } from '@/types/game';
import { getPlayerMapPosition } from '@/utils/layout-utils';

type GameMapProps = {
  mapSize: number;
  players: Player[];
  onMovePlayer: (playerId: string, position: PlayerPosition) => void;
};

export function GameMap({ mapSize, players, onMovePlayer }: GameMapProps) {
  return (
    <View
      style={{
        alignSelf: 'center',
        backgroundColor: '#111827',
        borderColor: '#334155',
        borderRadius: mapSize / 2,
        borderWidth: 1,
        height: mapSize,
        overflow: 'hidden',
        position: 'relative',
        width: mapSize,
      }}
    >
      {players.map((player) => (
        <PlayerToken
          key={player.id}
          mapSize={mapSize}
          onMove={onMovePlayer}
          player={player}
          position={getPlayerMapPosition(player, players, mapSize)}
        />
      ))}
    </View>
  );
}
