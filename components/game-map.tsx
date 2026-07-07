import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PlayerToken } from '@/components/player-token';
import type { Conversation, Player, PlayerPosition } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';
import { getPlayerMapPosition, getTokenSize } from '@/utils/layout-utils';

type GameMapProps = {
  activeDay: number;
  conversations: Conversation[];
  interactionMode?: boolean;
  mapHeight: number;
  mapWidth: number;
  players: Player[];
  tokenSize: number;
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
  tokenSize,
}: GameMapProps) {
  const positions = new Map(
    players.map((player) => [
      player.id,
      getPlayerMapPosition(player, players, mapWidth, mapHeight, tokenSize),
    ]),
  );
  const groupRepeats = buildConversationGroupRepeats(conversations, activeDay);

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
          .filter(
            (conversation) => conversation.day === activeDay && conversation.kind !== 'nomination',
          )
          .flatMap((conversation) => {
            const initiatorPosition = positions.get(conversation.initiatorId);
            const repeat = groupRepeats.get(getConversationGroupKey(conversation));
            const highlighted = repeat?.repeated === true;

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
                  <Path
                    key={`${conversation.id}-${playerId}`}
                    d={getConversationCurvePath(
                      initiatorPosition,
                      participantPosition,
                      mapWidth,
                      mapHeight,
                      tokenSize,
                      players
                        .filter(
                          (player) =>
                            player.id !== conversation.initiatorId && player.id !== playerId,
                        )
                        .map((player) => positions.get(player.id))
                        .filter((position): position is PlayerPosition => !!position),
                    )}
                    fill="none"
                    stroke={highlighted ? '#f59e0b' : '#38bdf8'}
                    strokeLinecap="round"
                    strokeOpacity={highlighted ? 0.95 : 0.76}
                    strokeWidth={highlighted ? 4 : 3}
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
          tokenSize={tokenSize}
          position={
            positions.get(player.id) ??
            getPlayerMapPosition(player, players, mapWidth, mapHeight, tokenSize)
          }
        />
      ))}
    </View>
  );
}

function getConversationCurvePath(
  from: PlayerPosition,
  to: PlayerPosition,
  mapWidth: number,
  mapHeight: number,
  tokenSize: number,
  blockers: PlayerPosition[],
) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  const distance = Math.hypot(deltaX, deltaY);
  const roomDistance = Math.hypot(mapWidth, mapHeight);
  const curveStrength = Math.max(0, 1 - distance / roomDistance);
  const baseControlOffset = 24 + curveStrength * 64;
  const midpointX = (from.x + to.x) / 2;
  const midpointY = (from.y + to.y) / 2;

  if (distance <= 0) {
    return `M ${from.x} ${from.y}`;
  }

  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const centerDeltaX = centerX - midpointX;
  const centerDeltaY = centerY - midpointY;
  const centerDistance = Math.hypot(centerDeltaX, centerDeltaY);
  const centerUnit =
    centerDistance > 0
      ? { x: centerDeltaX / centerDistance, y: centerDeltaY / centerDistance }
      : { x: 0, y: -1 };
  const blockerRadius = getTokenSize(tokenSize) / 2 + 8;
  const maxOffset = Math.max(mapWidth, mapHeight);
  const offsetSteps = [1, 1.4, 1.8, 2.3, 2.8, 3.4, 4.1, 5];

  for (const multiplier of offsetSteps) {
    const offset = Math.min(maxOffset, baseControlOffset * multiplier);
    const control = {
      x: midpointX + centerUnit.x * offset,
      y: midpointY + centerUnit.y * offset,
    };

    if (!curveOverlapsBlocker(from, control, to, blockers, blockerRadius)) {
      return `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`;
    }
  }

  const fallbackControl = {
    x: midpointX + centerUnit.x * maxOffset,
    y: midpointY + centerUnit.y * maxOffset,
  };

  return `M ${from.x} ${from.y} Q ${fallbackControl.x} ${fallbackControl.y} ${to.x} ${to.y}`;
}

function curveOverlapsBlocker(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  blockers: PlayerPosition[],
  blockerRadius: number,
) {
  const samples = 64;

  return blockers.some((blocker) => {
    for (let index = 0; index <= samples; index += 1) {
      const progress = index / samples;
      const point = getQuadraticPoint(from, control, to, progress);
      const deltaX = point.x - blocker.x;
      const deltaY = point.y - blocker.y;

      if (Math.hypot(deltaX, deltaY) < blockerRadius) {
        return true;
      }
    }

    return false;
  });
}

function getQuadraticPoint(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  progress: number,
): PlayerPosition {
  const inverse = 1 - progress;

  return {
    x: inverse * inverse * from.x + 2 * inverse * progress * control.x + progress * progress * to.x,
    y: inverse * inverse * from.y + 2 * inverse * progress * control.y + progress * progress * to.y,
  };
}
