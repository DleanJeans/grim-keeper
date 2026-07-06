import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PlayerToken } from '@/components/player-token';
import type { Conversation, Player, PlayerPosition } from '@/types/game';
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
                    stroke="#38bdf8"
                    strokeLinecap="round"
                    strokeOpacity={0.76}
                    strokeWidth={3}
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
  const controlOffset = 24 + curveStrength * 64;
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
  const controlX =
    centerDistance > 0 ? midpointX + (centerDeltaX / centerDistance) * controlOffset : centerX;
  const controlY =
    centerDistance > 0 ? midpointY + (centerDeltaY / centerDistance) * controlOffset : centerY;

  if (blockers.length === 0) {
    return `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`;
  }

  return getClippedQuadraticPath(from, { x: controlX, y: controlY }, to, tokenSize, blockers);
}

function getClippedQuadraticPath(
  from: PlayerPosition,
  control: PlayerPosition,
  to: PlayerPosition,
  tokenSize: number,
  blockers: PlayerPosition[],
) {
  const samples = 48;
  const blockerRadius = getTokenSize(tokenSize) / 2 + 5;
  const commands: string[] = [];
  let drawing = false;

  for (let index = 0; index <= samples; index += 1) {
    const progress = index / samples;
    const point = getQuadraticPoint(from, control, to, progress);
    const blocked = blockers.some((blocker) => {
      const deltaX = point.x - blocker.x;
      const deltaY = point.y - blocker.y;

      return Math.hypot(deltaX, deltaY) < blockerRadius;
    });

    if (blocked) {
      drawing = false;
      continue;
    }

    commands.push(`${drawing ? 'L' : 'M'} ${point.x} ${point.y}`);
    drawing = true;
  }

  return commands.join(' ');
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
