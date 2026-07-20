import { View } from 'react-native';
import Svg from 'react-native-svg';
import {
  ConnectionCurve,
  getInteractionCurvePlayerPairs,
} from '@/components/game/connection-curve';
import { useGameRouteContext } from '@/components/game/game-route-context';
import { PlayerToken } from '@/components/game/player-token';
import type { Player, PlayerPosition, Role } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';
import { getPlayerMapPosition } from '@/utils/layout-utils';
import { isPlayerCurrentlyDead } from '@/utils/player-utils';
import { getRoleDisplayForDayOrPrevious } from '@/utils/role-utils';

export function GameMap() {
  const {
    activeDay,
    activeTab,
    conversations,
    disabledPlayerIds,
    focusedPlayerId,
    hideConnectionCurves,
    interactionMode,
    mapWidth,
    mapHeight,
    nominationCurves,
    players,
    isRearrangeMode,
    activeTokenSize,
    game,
    highlightedPlayerIds,
    handleMovePlayer,
    handleSelectPlayer,
    showRoles,
  } = useGameRouteContext();

  const positions = new Map(
    players.map((player) => [
      player.id,
      getPlayerMapPosition(player, players, mapWidth, mapHeight, activeTokenSize),
    ]),
  );
  const selectedPlayerIdSet = new Set(highlightedPlayerIds);
  const showNominationCurves = activeTab === 'nominations';
  const showInteractionCurves = activeTab === 'interactions';
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
        {showNominationCurves &&
          nominationCurves.map(({ conversationId, initiatorId, nomineeId }) => {
            const involvesFocused =
              focusedPlayerId !== null &&
              (focusedPlayerId === initiatorId || focusedPlayerId === nomineeId);
            const connectedToFocused = focusedPlayerId === null || involvesFocused;
            const fromPosition = positions.get(initiatorId);
            const toPosition = positions.get(nomineeId);
            if (!fromPosition || !toPosition) {
              return null;
            }
            return (
              <ConnectionCurve
                key={`${conversationId}-nom-line`}
                blockers={players
                  .filter((player) => player.id !== initiatorId && player.id !== nomineeId)
                  .map((player) => positions.get(player.id))
                  .filter((position): position is PlayerPosition => !!position)}
                from={fromPosition}
                mapHeight={mapHeight}
                mapWidth={mapWidth}
                opacity={connectedToFocused ? 0.76 : 0.18}
                stroke="#a78bfa"
                strokeWidth={4}
                to={toPosition}
                tokenSize={activeTokenSize}
              />
            );
          })}
        {showInteractionCurves &&
          !hideConnectionCurves &&
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
                    tokenSize={activeTokenSize}
                  />,
                ];
              });
            })}
      </Svg>

      {players.map((player) => {
        const ownPosition =
          positions.get(player.id) ??
          getPlayerMapPosition(player, players, mapWidth, mapHeight, activeTokenSize);
        const otherTokenPositions: { x: number; y: number }[] = [];
        for (const other of players) {
          if (other.id === player.id) {
            continue;
          }
          const otherPosition =
            positions.get(other.id) ??
            getPlayerMapPosition(other, players, mapWidth, mapHeight, activeTokenSize);
          otherTokenPositions.push(otherPosition);
        }
        return (
          <PlayerTokenForMap
            key={player.id}
            activeDay={activeDay}
            activeTokenSize={activeTokenSize}
            disabled={disabledPlayerIdSet.has(player.id)}
            gameRoles={game.script?.roles ?? []}
            handleMovePlayer={handleMovePlayer}
            handleSelectPlayer={handleSelectPlayer}
            highlightedPlayerIds={highlightedPlayerIds}
            interactionMode={interactionMode}
            isNominated={nominatedIds.has(player.id)}
            isNominator={nominatorIds.has(player.id)}
            isRearrangeMode={isRearrangeMode}
            mapHeight={mapHeight}
            mapWidth={mapWidth}
            otherTokenPositions={otherTokenPositions}
            player={stripFutureAndRevivedDeath(player, activeDay)}
            position={ownPosition}
            showRoles={showRoles}
          />
        );
      })}
    </View>
  );
}

function PlayerTokenForMap({
  activeDay,
  activeTokenSize,
  disabled,
  gameRoles,
  handleMovePlayer,
  handleSelectPlayer,
  highlightedPlayerIds,
  interactionMode,
  isNominated,
  isNominator,
  isRearrangeMode,
  mapHeight,
  mapWidth,
  otherTokenPositions,
  player,
  position,
  showRoles,
}: {
  activeDay: number;
  activeTokenSize: number;
  disabled: boolean;
  gameRoles: Role[];
  handleMovePlayer: (playerId: string, position: PlayerPosition) => void;
  handleSelectPlayer: (playerId: string) => void;
  highlightedPlayerIds: string[];
  interactionMode: boolean;
  isNominated: boolean;
  isNominator: boolean;
  isRearrangeMode: boolean;
  mapHeight: number;
  mapWidth: number;
  otherTokenPositions: { x: number; y: number }[];
  player: Player;
  position: PlayerPosition;
  showRoles: boolean;
}) {
  const roleDisplay = getRoleDisplayForDayOrPrevious(player.roleAssignments, activeDay, gameRoles);

  return (
    <PlayerToken
      confirmedRoleIds={roleDisplay.kind === 'confirm' ? roleDisplay.roleIds : undefined}
      disabled={disabled}
      interactionMode={interactionMode}
      isInitiator={highlightedPlayerIds[0] === player.id}
      isNominated={isNominated}
      isNominator={isNominator}
      isSelected={highlightedPlayerIds.includes(player.id)}
      mapHeight={mapHeight}
      mapWidth={mapWidth}
      onMove={handleMovePlayer}
      onSelect={handleSelectPlayer}
      otherTokenPositions={otherTokenPositions}
      player={player}
      position={position}
      rearrangeMode={isRearrangeMode}
      roles={roleDisplay.roles}
      rolesConfirmed={roleDisplay.kind === 'confirm'}
      showRoleDetails={showRoles}
      tokenSize={activeTokenSize}
    />
  );
}

function stripFutureAndRevivedDeath(player: Player, activeDay: number): Player {
  if (!player.death) {
    return player;
  }

  if (player.death.day > activeDay) {
    return { ...player, death: undefined };
  }

  if (!isPlayerCurrentlyDead(player, activeDay)) {
    return { ...player, death: undefined };
  }

  return player;
}
