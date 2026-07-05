import { View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { PlayerToken } from '@/components/player-token';
import type { Conversation, Player, PlayerPosition } from '@/types/game';
import { getPlayerMapPosition } from '@/utils/layout-utils';

type GameMapProps = {
  activeDay: number;
  conversations: Conversation[];
  interactionMode?: boolean;
  mapHeight: number;
  mapWidth: number;
  players: Player[];
  onMovePlayer: (playerId: string, position: PlayerPosition) => void;
  onSelectPlayer?: (playerId: string) => void;
  selectedPlayerIds?: string[];
};

export function GameMap({
  activeDay,
  conversations,
  interactionMode = false,
  mapHeight,
  mapWidth,
  onMovePlayer,
  onSelectPlayer,
  players,
  selectedPlayerIds = [],
}: GameMapProps) {
  const positions = new Map(
    players.map((player) => [
      player.id,
      getPlayerMapPosition(player, players, mapWidth, mapHeight),
    ]),
  );

  return (
    <View
      style={{
        alignSelf: 'center',
        backgroundColor: '#111827',
        borderColor: '#334155',
        borderRadius: 8,
        borderWidth: 1,
        height: mapHeight,
        overflow: 'hidden',
        position: 'relative',
        width: mapWidth,
      }}
    >
      <Svg
        height={mapHeight}
        pointerEvents="none"
        style={{ position: 'absolute' }}
        width={mapWidth}
      >
        {conversations
          .filter((conversation) => conversation.day === activeDay)
          .flatMap((conversation) => {
            const initiatorPosition = positions.get(conversation.initiatorId);

            if (!initiatorPosition) {
              return [];
            }

            return conversation.participantIds
              .filter((playerId) => playerId !== conversation.initiatorId)
              .map((playerId) => {
                const participantPosition = positions.get(playerId);

                if (!participantPosition) {
                  return null;
                }

                return (
                  <Line
                    key={`${conversation.id}-${playerId}`}
                    stroke="#38bdf8"
                    strokeOpacity={0.76}
                    strokeWidth={3}
                    x1={initiatorPosition.x}
                    x2={participantPosition.x}
                    y1={initiatorPosition.y}
                    y2={participantPosition.y}
                  />
                );
              });
          })}
      </Svg>

      {players.map((player) => (
        <PlayerToken
          key={player.id}
          interactionMode={interactionMode}
          isInitiator={selectedPlayerIds[0] === player.id}
          isSelected={selectedPlayerIds.includes(player.id)}
          mapHeight={mapHeight}
          mapWidth={mapWidth}
          onMove={onMovePlayer}
          onSelect={onSelectPlayer}
          player={player}
          position={
            positions.get(player.id) ?? getPlayerMapPosition(player, players, mapWidth, mapHeight)
          }
        />
      ))}
    </View>
  );
}
