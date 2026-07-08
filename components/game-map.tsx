import { View } from 'react-native';
import Svg, { Path, Polygon } from 'react-native-svg';

import { PlayerToken } from '@/components/player-token';
import type { Conversation, Player, PlayerPosition } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';
import { getPlayerMapPosition, getTokenSize } from '@/utils/layout-utils';

type GameMapProps = {
  activeDay: number;
  conversations: Conversation[];
  disabledPlayerIds?: string[];
  hideConnectionCurves?: boolean;
  interactionMode?: boolean;
  mapHeight: number;
  mapWidth: number;
  nominationCurvePlayerIds?: string[];
  players: Player[];
  tokenSize: number;
  onMovePlayer: (playerId: string, position: PlayerPosition) => void;
  onSelectPlayer?: (playerId: string) => void;
  selectedPlayerIds?: string[];
};

export function GameMap({
  activeDay,
  conversations,
  disabledPlayerIds = [],
  hideConnectionCurves = false,
  interactionMode = false,
  mapHeight,
  mapWidth,
  nominationCurvePlayerIds = [],
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
  const selectedPlayerIdSet = new Set(selectedPlayerIds);
  const [nominatorId, nomineeId] = nominationCurvePlayerIds;
  const groupRepeats = buildConversationGroupRepeats(conversations, activeDay);
  const disabledPlayerIdSet = new Set(disabledPlayerIds);
  const activeDayNominations = conversations.filter(
    (conversation) => conversation.day === activeDay && conversation.kind === 'nomination',
  );
  const nominatorIds = new Set(activeDayNominations.map((nomination) => nomination.initiatorId));
  const nominatedIds = new Set(
    activeDayNominations.flatMap((nomination) =>
      nomination.participantIds.filter((playerId) => playerId !== nomination.initiatorId),
    ),
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
        {nominatorId && nomineeId && (
          <ConnectionCurve
            blockers={players
              .filter((player) => player.id !== nominatorId && player.id !== nomineeId)
              .map((player) => positions.get(player.id))
              .filter((position): position is PlayerPosition => !!position)}
            from={positions.get(nominatorId)}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            stroke="#a78bfa"
            strokeWidth={4}
            to={positions.get(nomineeId)}
            tokenSize={tokenSize}
          />
        )}
        {!hideConnectionCurves &&
          conversations
            .filter(
              (conversation) =>
                conversation.day === activeDay && conversation.kind !== 'nomination',
            )
            .flatMap((conversation) => {
              const repeat = groupRepeats.get(getConversationGroupKey(conversation));
              const highlighted = repeat?.repeated === true;

              return getInteractionCurvePlayerPairs(conversation).flatMap(([fromId, toId]) => {
                const fromPosition = positions.get(fromId);
                const toPosition = positions.get(toId);

                if (!fromPosition || !toPosition) {
                  return [];
                }

                const stroke = highlighted ? '#f59e0b' : '#38bdf8';
                const connectedToSelected =
                  selectedPlayerIdSet.size === 0 ||
                  selectedPlayerIdSet.has(fromId) ||
                  selectedPlayerIdSet.has(toId);
                const opacity = connectedToSelected ? (highlighted ? 0.95 : 0.76) : 0.18;

                return [
                  <ConnectionCurve
                    key={`${conversation.id}-${fromId}-${toId}-line`}
                    blockers={players
                      .filter((player) => player.id !== fromId && player.id !== toId)
                      .map((player) => positions.get(player.id))
                      .filter((position): position is PlayerPosition => !!position)}
                    from={fromPosition}
                    mapHeight={mapHeight}
                    mapWidth={mapWidth}
                    opacity={opacity}
                    stroke={stroke}
                    strokeWidth={highlighted ? 4 : 3}
                    to={toPosition}
                    tokenSize={tokenSize}
                  />,
                ];
              });
            })}
      </Svg>

      {players.map((player) => (
        <PlayerToken
          key={player.id}
          disabled={disabledPlayerIdSet.has(player.id)}
          interactionMode={interactionMode}
          isInitiator={selectedPlayerIds[0] === player.id}
          isNominated={nominatedIds.has(player.id)}
          isNominator={nominatorIds.has(player.id)}
          isSelected={selectedPlayerIds.includes(player.id)}
          mapHeight={mapHeight}
          mapWidth={mapWidth}
          onMove={onMovePlayer}
          onSelect={onSelectPlayer}
          player={
            player.death && player.death.day > activeDay ? { ...player, death: undefined } : player
          }
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

function getInteractionCurvePlayerPairs(conversation: Conversation) {
  const playerIds = [...new Set(conversation.participantIds)];
  const pairs: [string, string][] = [];

  for (let index = 0; index < playerIds.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < playerIds.length; nextIndex += 1) {
      pairs.push([playerIds[index], playerIds[nextIndex]]);
    }
  }

  return pairs;
}

function ConnectionCurve({
  blockers,
  from,
  mapHeight,
  mapWidth,
  opacity = 0.9,
  stroke,
  strokeWidth,
  to,
  tokenSize,
}: {
  blockers: PlayerPosition[];
  from?: PlayerPosition;
  mapHeight: number;
  mapWidth: number;
  opacity?: number;
  stroke: string;
  strokeWidth: number;
  to?: PlayerPosition;
  tokenSize: number;
}) {
  if (!from || !to) {
    return null;
  }

  const curve = getConversationCurve(from, to, mapWidth, mapHeight, tokenSize, blockers);

  return (
    <>
      <Path
        d={curve.path}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeOpacity={opacity}
        strokeWidth={strokeWidth}
      />
      <Polygon fill={stroke} opacity={opacity} points={curve.arrowPoints} />
    </>
  );
}

function getConversationCurve(
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
  const tokenRadius = getTokenSize(tokenSize) / 2;
  const center = { x: mapWidth / 2, y: mapHeight / 2 };
  const start = getTokenEdgePoint(from, center, tokenRadius);
  const end = getTokenEdgePoint(to, center, tokenRadius);
  const curveStrength = Math.max(0, 1 - distance / roomDistance);
  const baseControlOffset = 24 + curveStrength * 64;
  const midpointX = (start.x + end.x) / 2;
  const midpointY = (start.y + end.y) / 2;

  if (distance <= 0) {
    return {
      arrowPoints: `${start.x},${start.y}`,
      path: `M ${start.x} ${start.y}`,
    };
  }

  const centerDeltaX = center.x - midpointX;
  const centerDeltaY = center.y - midpointY;
  const centerDistance = Math.hypot(centerDeltaX, centerDeltaY);
  const centerUnit =
    centerDistance > 0
      ? { x: centerDeltaX / centerDistance, y: centerDeltaY / centerDistance }
      : { x: 0, y: -1 };
  const blockerRadius = tokenRadius + 8;
  const maxOffset = Math.max(mapWidth, mapHeight);
  const offsetSteps = [1, 1.4, 1.8, 2.3, 2.8, 3.4, 4.1, 5];

  for (const multiplier of offsetSteps) {
    const offset = Math.min(maxOffset, baseControlOffset * multiplier);
    const control = {
      x: midpointX + centerUnit.x * offset,
      y: midpointY + centerUnit.y * offset,
    };

    if (!curveOverlapsBlocker(start, control, end, blockers, blockerRadius)) {
      return {
        arrowPoints: getArrowPoints(end, control),
        path: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${end.x} ${end.y}`,
      };
    }
  }

  const fallbackControl = {
    x: midpointX + centerUnit.x * maxOffset,
    y: midpointY + centerUnit.y * maxOffset,
  };

  return {
    arrowPoints: getArrowPoints(end, fallbackControl),
    path: `M ${start.x} ${start.y} Q ${fallbackControl.x} ${fallbackControl.y} ${end.x} ${end.y}`,
  };
}

function getTokenEdgePoint(
  tokenCenter: PlayerPosition,
  mapCenter: PlayerPosition,
  tokenRadius: number,
) {
  const deltaX = mapCenter.x - tokenCenter.x;
  const deltaY = mapCenter.y - tokenCenter.y;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance <= 0) {
    return tokenCenter;
  }

  return {
    x: tokenCenter.x + (deltaX / distance) * tokenRadius,
    y: tokenCenter.y + (deltaY / distance) * tokenRadius,
  };
}

function getArrowPoints(tip: PlayerPosition, control: PlayerPosition) {
  const angle = Math.atan2(tip.y - control.y, tip.x - control.x);
  const length = 12;
  const spread = Math.PI / 7;

  return [
    `${tip.x},${tip.y}`,
    `${tip.x - Math.cos(angle - spread) * length},${tip.y - Math.sin(angle - spread) * length}`,
    `${tip.x - Math.cos(angle + spread) * length},${tip.y - Math.sin(angle + spread) * length}`,
  ].join(' ');
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
