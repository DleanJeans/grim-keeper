import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import {
  ConnectionCurve,
  getInteractionCurvePlayerPairs,
  type PlacedLineEnd,
} from '@/components/game/connection-curve';
import { useGameRouteContext } from '@/components/game/game-route-context';
import type { OtherTokenPosition } from '@/components/game/player-token';
import { PlayerToken } from '@/components/game/player-token';
import { colors } from '@/theme/colors';
import type { Conversation, Player, PlayerPosition, Role, RoleDisplayMode } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';
import type { GamePhasePosition } from '@/utils/game-phase-utils';
import { getPlayerMapPosition, getPlayerTokenScale } from '@/utils/layout-utils';
import {
  getPlayerTokenName,
  hasDeadVoteAvailable,
  isPlayerCurrentlyDead,
} from '@/utils/player-utils';
import { getRoleInfoTargetPlayers, inferRoleInfos } from '@/utils/role-info-utils';
import {
  getLatestRumorMapDisplaysForDayOrPrevious,
  getRoleDisplayForModes,
} from '@/utils/role-utils';

export function GameMap() {
  const {
    activeDay,
    activeDayCutoff,
    activePhase,
    activeRoleDisplayModes,
    activeTab,
    conversations,
    disabledPlayerIds,
    focusedPlayerId,
    hideConnectionCurves,
    interactionMode,
    mapWidth,
    mapHeight,
    mapScale,
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

  const displayMapWidth = mapWidth * mapScale;
  const displayMapHeight = mapHeight * mapScale;
  const activePosition = { activeDay, activePhase };

  const positions = useMemo(
    () =>
      new Map(
        players.map((player) => [
          player.id,
          getPlayerMapPosition(player, players, mapWidth, mapHeight, activeTokenSize),
        ]),
      ),
    [activeTokenSize, mapHeight, mapWidth, players],
  );
  // Two players nominating each other share one line with an arrowhead at each end.
  const mapNominationCurves = useMemo(() => {
    const pairKeys = new Set(
      nominationCurves.map(({ initiatorId, nomineeId }) => `${initiatorId}>${nomineeId}`),
    );
    const drawnPairKeys = new Set<string>();

    return nominationCurves.flatMap((curve) => {
      const reverseKey = `${curve.nomineeId}>${curve.initiatorId}`;

      if (drawnPairKeys.has(reverseKey)) {
        return [];
      }
      drawnPairKeys.add(`${curve.initiatorId}>${curve.nomineeId}`);

      return [{ ...curve, twoWay: pairKeys.has(reverseKey) }];
    });
  }, [nominationCurves]);
  const selectedPlayerIdSet = useMemo(() => new Set(highlightedPlayerIds), [highlightedPlayerIds]);
  const showNominationCurves = activeTab === 'nominations';
  const showInteractionCurves = activeTab === 'interactions';
  const showRumorCurves =
    activeTab === 'notes' &&
    (activeRoleDisplayModes.includes('all') || activeRoleDisplayModes.includes('rumor')) &&
    showRoles;
  const rumorMapDisplays = showRumorCurves
    ? getLatestRumorMapDisplaysForDayOrPrevious(
        players,
        activeDay,
        game.script?.roles ?? [],
        activePhase,
      )
    : [];
  // The focused player points at the players their character info is about.
  const roleInfoTargets = useMemo(() => {
    const focusedPlayer = players.find((player) => player.id === focusedPlayerId);
    if (activeTab !== 'notes' || !showRoles || !focusedPlayer) return [];

    const roles = game.script?.roles ?? [];
    const roleInfos = [
      ...(game.roleInfos ?? []),
      ...inferRoleInfos(players, game.playerDayNotes, game.roleInfos, roles, conversations),
    ];
    const targets = getRoleInfoTargetPlayers(
      focusedPlayer,
      players,
      conversations,
      roleInfos,
      roles,
      activeDay,
      activePhase,
    );
    const origin = positions.get(focusedPlayer.id);
    const getDistance = (player: Player) => {
      const position = positions.get(player.id);
      return origin && position ? Math.hypot(position.x - origin.x, position.y - origin.y) : 0;
    };
    // Nearest first, so a line to a touching neighbor gets its spot before longer lines take it.
    return targets.sort((first, second) => getDistance(first) - getDistance(second));
  }, [
    activeDay,
    activePhase,
    activeTab,
    conversations,
    focusedPlayerId,
    game.playerDayNotes,
    game.roleInfos,
    game.script?.roles,
    players,
    positions,
    showRoles,
  ]);
  const groupRepeats = useMemo(
    () => buildConversationGroupRepeats(conversations, activeDayCutoff),
    [activeDayCutoff, conversations],
  );
  const disabledPlayerIdSet = useMemo(() => new Set(disabledPlayerIds), [disabledPlayerIds]);

  // Filled in as each curve renders, so later curves steer clear of earlier line ends and arrowheads
  // and avoid crossing earlier lines.
  const placedLineEnds: PlacedLineEnd[] = [];
  const placedPaths: PlayerPosition[][] = [];

  return (
    <View style={[styles.mapViewport, { height: displayMapHeight, width: displayMapWidth }]}>
      <View
        style={[
          styles.map,
          {
            height: mapHeight,
            transform: [{ scale: mapScale }],
            width: mapWidth,
          },
        ]}
      >
        <Svg height={mapHeight} style={styles.svg} width={mapWidth}>
          {showNominationCurves &&
            mapNominationCurves.map(({ conversationId, initiatorId, nomineeId, twoWay }) => {
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
                  opacity={connectedToFocused ? 1 : 0.18}
                  stroke="#a78bfa"
                  strokeWidth={4}
                  placedLineEnds={placedLineEnds}
                  placedPaths={placedPaths}
                  to={toPosition}
                  tokenSize={activeTokenSize}
                  twoWay={twoWay}
                />
              );
            })}
          {showInteractionCurves &&
            !hideConnectionCurves &&
            conversations
              .filter(
                (conversation) =>
                  conversation.day === activeDayCutoff && conversation.kind !== 'nomination',
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
                      placedLineEnds={placedLineEnds}
                      placedPaths={placedPaths}
                      to={toPosition}
                      tokenSize={activeTokenSize}
                    />,
                  ];
                });
              })}
          {rumorMapDisplays.map(({ sourcePlayer, subjectPlayer }) => {
            const fromPosition = positions.get(sourcePlayer.id);
            const toPosition = positions.get(subjectPlayer.id);
            if (!fromPosition || !toPosition) {
              return null;
            }

            const involvesFocused =
              focusedPlayerId !== null &&
              (focusedPlayerId === sourcePlayer.id || focusedPlayerId === subjectPlayer.id);
            const connectedToFocused = focusedPlayerId === null || involvesFocused;

            return (
              <ConnectionCurve
                key={`rumor-${sourcePlayer.id}-${subjectPlayer.id}`}
                blockers={players
                  .filter(
                    (player) => player.id !== sourcePlayer.id && player.id !== subjectPlayer.id,
                  )
                  .map((player) => positions.get(player.id))
                  .filter((position): position is PlayerPosition => !!position)}
                from={fromPosition}
                mapHeight={mapHeight}
                mapWidth={mapWidth}
                opacity={connectedToFocused ? 0.82 : 0.18}
                stroke={colors.roleRumor}
                strokeWidth={4}
                placedLineEnds={placedLineEnds}
                placedPaths={placedPaths}
                to={toPosition}
                tokenSize={activeTokenSize}
              />
            );
          })}
          {roleInfoTargets.map((target) => {
            const fromPosition = focusedPlayerId ? positions.get(focusedPlayerId) : undefined;
            const toPosition = positions.get(target.id);
            if (!fromPosition || !toPosition) {
              return null;
            }

            return (
              <ConnectionCurve
                key={`role-info-${target.id}`}
                blockers={players
                  .filter((player) => player.id !== focusedPlayerId && player.id !== target.id)
                  .map((player) => positions.get(player.id))
                  .filter((position): position is PlayerPosition => !!position)}
                from={fromPosition}
                mapHeight={mapHeight}
                mapWidth={mapWidth}
                opacity={1}
                stroke={colors.roleInfoTargetLine}
                strokeWidth={4}
                placedLineEnds={placedLineEnds}
                placedPaths={placedPaths}
                to={toPosition}
                tokenSize={activeTokenSize}
              />
            );
          })}
        </Svg>

        {players.map((player) => {
          const ownPosition =
            positions.get(player.id) ??
            getPlayerMapPosition(player, players, mapWidth, mapHeight, activeTokenSize);
          const otherTokenPositions: OtherTokenPosition[] = [];
          for (const other of players) {
            if (other.id === player.id) {
              continue;
            }
            const otherPosition =
              positions.get(other.id) ??
              getPlayerMapPosition(other, players, mapWidth, mapHeight, activeTokenSize);
            otherTokenPositions.push({
              ...otherPosition,
              size: activeTokenSize * getPlayerTokenScale(other, players),
            });
          }
          return (
            <PlayerTokenForMap
              key={player.id}
              activeDay={activeDay}
              phaseDay={activeDay}
              activePhase={activePhase}
              activeRoleDisplayModes={activeRoleDisplayModes}
              activeTokenSize={activeTokenSize}
              disabled={disabledPlayerIdSet.has(player.id)}
              gameRoles={game.script?.roles ?? []}
              conversations={conversations}
              handleMovePlayer={handleMovePlayer}
              handleSelectPlayer={handleSelectPlayer}
              highlightedPlayerIds={highlightedPlayerIds}
              interactionMode={interactionMode}
              isRearrangeMode={isRearrangeMode}
              mapHeight={mapHeight}
              mapScale={mapScale}
              mapWidth={mapWidth}
              otherTokenPositions={otherTokenPositions}
              player={stripFutureAndRevivedDeath(player, activePosition)}
              players={players}
              position={ownPosition}
              showRoles={showRoles}
            />
          );
        })}
      </View>
    </View>
  );
}

function PlayerTokenForMap({
  activeDay,
  phaseDay,
  activePhase,
  activeRoleDisplayModes,
  activeTokenSize,
  disabled,
  gameRoles,
  conversations,
  handleMovePlayer,
  handleSelectPlayer,
  highlightedPlayerIds,
  interactionMode,
  isRearrangeMode,
  mapHeight,
  mapScale,
  mapWidth,
  otherTokenPositions,
  player,
  players,
  position,
  showRoles,
}: {
  activeDay: number;
  phaseDay: number;
  activePhase: GamePhasePosition['activePhase'];
  activeRoleDisplayModes: RoleDisplayMode[];
  activeTokenSize: number;
  disabled: boolean;
  gameRoles: Role[];
  conversations: Conversation[];
  handleMovePlayer: (playerId: string, position: PlayerPosition) => void;
  handleSelectPlayer: (playerId: string) => void;
  highlightedPlayerIds: string[];
  interactionMode: boolean;
  isRearrangeMode: boolean;
  mapHeight: number;
  mapScale: number;
  mapWidth: number;
  otherTokenPositions: OtherTokenPosition[];
  player: Player;
  players: Player[];
  position: PlayerPosition;
  showRoles: boolean;
}) {
  const roleDisplay = getRoleDisplayForModes(
    player,
    players,
    activeDay,
    gameRoles,
    activeRoleDisplayModes,
    activePhase,
  );
  const deadVoteAvailable = hasDeadVoteAvailable(player, phaseDay, activePhase, conversations);

  return (
    <PlayerToken
      confirmedRoleIds={roleDisplay.kind === 'confirm' ? roleDisplay.roleIds : undefined}
      disabled={disabled}
      displayName={getPlayerTokenName(player, players)}
      deadVoteAvailable={deadVoteAvailable}
      interactionMode={interactionMode}
      isInitiator={highlightedPlayerIds[0] === player.id}
      isSelected={highlightedPlayerIds.includes(player.id)}
      mapHeight={mapHeight}
      mapScale={mapScale}
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
      tokenScale={getPlayerTokenScale(player, players)}
      tokenSize={activeTokenSize}
    />
  );
}

function stripFutureAndRevivedDeath(player: Player, activePosition: GamePhasePosition): Player {
  if (!player.death) {
    return player;
  }

  if (!isPlayerCurrentlyDead(player, activePosition.activeDay, activePosition.activePhase)) {
    return { ...player, death: undefined };
  }

  return player;
}

const styles = StyleSheet.create({
  map: {
    alignItems: 'stretch',
    backgroundColor: colors.gameSurface,
    borderColor: colors.gameBorder,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewport: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  svg: {
    pointerEvents: 'none',
    position: 'absolute',
  },
});
