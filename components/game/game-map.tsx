import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import {
  ConnectionCurve,
  getConnectionCurve,
  getInteractionCurvePlayerPairs,
  type PlacedLineEnd,
} from '@/components/game/connection-curve';
import { ConnectionCurveShape } from '@/components/game/connection-curve-shape';
import { useGameRouteContext } from '@/components/game/game-route-context';
import type { OtherTokenPosition } from '@/components/game/player-token';
import { PlayerToken } from '@/components/game/player-token';
import { RoleInfoMapToken } from '@/components/game/role-info-map-token';
import { colors } from '@/theme/colors';
import type { Conversation, Player, PlayerPosition, Role, RoleDisplayMode } from '@/types/game';
import { buildConversationGroupRepeats, getConversationGroupKey } from '@/utils/conversation-utils';
import type { GamePhasePosition } from '@/utils/game-phase-utils';
import { getPlayerMapPosition, getPlayerTokenScale, getTokenSize } from '@/utils/layout-utils';
import {
  getPlayerTokenName,
  hasDeadVoteAvailable,
  isPlayerCurrentlyDead,
} from '@/utils/player-utils';
import {
  getRoleInfoMapRoles,
  getRoleInfoTargetPlayers,
  inferRoleInfos,
} from '@/utils/role-info-utils';
import {
  getLatestRumorMapDisplaysForDayOrPrevious,
  getRoleDisplayForModes,
} from '@/utils/role-utils';

const ROLE_INFO_STROKE_WIDTH = 4;
// Character tokens next to role info arrows, as a fraction of a player token.
const ROLE_INFO_TOKEN_RATIO = 0.5;
// How far a character token tucks under the player token it sits beside.
const ROLE_INFO_TOKEN_OVERLAP = 4;
// Angle between the start tokens of two characters about the same players.
const SOURCE_TOKEN_SPREAD = 0.7;
// Angles (radians) to turn a start token around the focused player when it would cover another
// token, nearest first.
const SOURCE_TOKEN_SHIFTS = Array.from({ length: 25 }, (_, step) =>
  step === 0 ? 0 : (step % 2 === 1 ? 1 : -1) * Math.ceil(step / 2) * (Math.PI / 12),
);

type RoleInfoMapTokenPlacement = { key: string; position: PlayerPosition; role: Role };

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
  const roleInfoTokenSize = getTokenSize(activeTokenSize) * ROLE_INFO_TOKEN_RATIO;
  // The focused player points at the players their character info is about. A character the info
  // names about several players sits where those arrows start; one about a single player sits
  // on that player.
  const roleInfoMap = useMemo(() => {
    const focusedPlayer = players.find((player) => player.id === focusedPlayerId);
    if (activeTab !== 'notes' || !showRoles || !focusedPlayer) {
      return { sourceTokens: [], targetRoles: new Map<string, Role[]>(), targets: [] };
    }

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
    targets.sort((first, second) => getDistance(first) - getDistance(second));
    if (!origin) return { sourceTokens: [], targetRoles: new Map<string, Role[]>(), targets };

    const { sourceRoles, targetRoles } = getRoleInfoMapRoles(
      focusedPlayer,
      players,
      roleInfos,
      roles,
      activeDay,
      activePhase,
    );
    const getTokenRadius = (player: Player) =>
      (getTokenSize(activeTokenSize) * getPlayerTokenScale(player, players)) / 2;
    const clampToMap = (position: PlayerPosition) =>
      clampRoleInfoToken(position, roleInfoTokenSize, mapWidth, mapHeight);
    const sourceDistance =
      getTokenRadius(focusedPlayer) + roleInfoTokenSize / 2 - ROLE_INFO_TOKEN_OVERLAP;
    // Circles the start tokens must stay clear of: the other players, then earlier start tokens.
    const sourceObstacles = players.flatMap((player) => {
      const position = positions.get(player.id);
      return player.id === focusedPlayer.id || !position
        ? []
        : [{ ...position, radius: getTokenRadius(player) }];
    });
    const sourceTokens = sourceRoles.map(({ role, targetIds }, index) => {
      const meanAngle =
        getMeanAngle(
          origin,
          targetIds.flatMap((targetId) => positions.get(targetId) ?? []),
        ) + getSpreadOffset(index, sourceRoles.length, SOURCE_TOKEN_SPREAD);
      // Turn around the focused player, nearest the arrows' direction first, until clear.
      let best: { overlap: number; position: PlayerPosition } | null = null;
      for (const shift of SOURCE_TOKEN_SHIFTS) {
        const angle = meanAngle + shift;
        const unclamped = {
          x: origin.x + Math.cos(angle) * sourceDistance,
          y: origin.y + Math.sin(angle) * sourceDistance,
        };
        const position = clampToMap(unclamped);
        const overlap = Math.max(
          Math.hypot(position.x - unclamped.x, position.y - unclamped.y),
          ...sourceObstacles.map(
            (obstacle) =>
              obstacle.radius +
              roleInfoTokenSize / 2 -
              Math.hypot(position.x - obstacle.x, position.y - obstacle.y),
          ),
        );
        if (!best || overlap < best.overlap) best = { overlap, position };
        if (overlap <= 0) break;
      }
      const position = best?.position ?? origin;
      sourceObstacles.push({ ...position, radius: roleInfoTokenSize / 2 });
      return { key: `role-info-source-${role.id}-${index}`, position, role, targetIds };
    });
    return { sourceTokens, targetRoles, targets };
  }, [
    activeDay,
    activePhase,
    activeTab,
    activeTokenSize,
    conversations,
    focusedPlayerId,
    game.playerDayNotes,
    game.roleInfos,
    game.script?.roles,
    mapHeight,
    mapWidth,
    players,
    positions,
    roleInfoTokenSize,
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
  // Role info lines are placed first, so their ends, where the character tokens sit, get the
  // clearest spots. A target's character tokens straddle its edge where the line ends, and the
  // line stops at their outer edge.
  const roleInfoCurves = roleInfoMap.targets.flatMap((target) => {
    const sourceToken = roleInfoMap.sourceTokens.find(({ targetIds }) =>
      targetIds.includes(target.id),
    );
    const fromPosition =
      sourceToken?.position ?? (focusedPlayerId ? positions.get(focusedPlayerId) : undefined);
    const toPosition = positions.get(target.id);
    if (!fromPosition || !toPosition) return [];

    const targetRoleList = roleInfoMap.targetRoles.get(target.id) ?? [];
    const targetRadius = (getTokenSize(activeTokenSize) * getPlayerTokenScale(target, players)) / 2;
    // Character tokens straddle the target's edge at the line's end, side by side across the line
    // so it points between them.
    const getTokenPositions = (tip: PlayerPosition) => {
      const angle = Math.atan2(tip.y - toPosition.y, tip.x - toPosition.x);
      const center = {
        x: toPosition.x + Math.cos(angle) * targetRadius,
        y: toPosition.y + Math.sin(angle) * targetRadius,
      };
      return targetRoleList.map((_, index) => {
        const offset = getSpreadOffset(index, targetRoleList.length, roleInfoTokenSize + 2);
        return { x: center.x - Math.sin(angle) * offset, y: center.y + Math.cos(angle) * offset };
      });
    };
    // The line ends where its character tokens cover no other player and stay on the map.
    const tokensFit = (tip: PlayerPosition) =>
      getTokenPositions(tip).every(
        (position) =>
          position.x >= roleInfoTokenSize / 2 &&
          position.y >= roleInfoTokenSize / 2 &&
          position.x <= mapWidth - roleInfoTokenSize / 2 &&
          position.y <= mapHeight - roleInfoTokenSize / 2 &&
          players.every((player) => {
            const playerPosition = positions.get(player.id);
            return (
              player.id === target.id ||
              !playerPosition ||
              Math.hypot(position.x - playerPosition.x, position.y - playerPosition.y) >=
                (getTokenSize(activeTokenSize) * getPlayerTokenScale(player, players)) / 2 +
                  roleInfoTokenSize / 2
            );
          }),
      );
    const curve = getConnectionCurve(
      fromPosition,
      toPosition,
      mapWidth,
      mapHeight,
      activeTokenSize,
      ROLE_INFO_STROKE_WIDTH,
      players
        .filter((player) => player.id !== focusedPlayerId && player.id !== target.id)
        .map((player) => positions.get(player.id))
        .filter((position): position is PlayerPosition => !!position),
      false,
      placedLineEnds,
      placedPaths,
      sourceToken ? roleInfoTokenSize / 2 : undefined,
      targetRoleList.length > 0 ? targetRadius + roleInfoTokenSize / 2 : undefined,
      targetRoleList.length > 0 ? tokensFit : undefined,
    );
    if (!curve) return [];

    const tokenPositions = getTokenPositions(curve.endTip);
    const tokens = targetRoleList.map(
      (role, index): RoleInfoMapTokenPlacement => ({
        key: `role-info-target-${target.id}-${role.id}-${index}`,
        position: clampRoleInfoToken(tokenPositions[index], roleInfoTokenSize, mapWidth, mapHeight),
        role,
      }),
    );
    return [{ curve, key: `role-info-${target.id}`, tokens }];
  });

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

                  const stroke = highlighted ? colors.repeatBorder : colors.interactionLine;
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
          {roleInfoCurves.map(({ curve, key }) => (
            <ConnectionCurveShape
              key={key}
              curve={curve}
              opacity={1}
              stroke={colors.roleInfoTargetLine}
              strokeWidth={ROLE_INFO_STROKE_WIDTH}
            />
          ))}
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
        {[...roleInfoMap.sourceTokens, ...roleInfoCurves.flatMap(({ tokens }) => tokens)].map(
          ({ key, position, role }) => (
            <RoleInfoMapToken key={key} position={position} role={role} size={roleInfoTokenSize} />
          ),
        )}
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

/** Keeps a character token of the given size inside the map. */
function clampRoleInfoToken(
  position: PlayerPosition,
  size: number,
  mapWidth: number,
  mapHeight: number,
) {
  return {
    x: Math.min(Math.max(position.x, size / 2), mapWidth - size / 2),
    y: Math.min(Math.max(position.y, size / 2), mapHeight - size / 2),
  };
}

/** Direction from `origin` that points between the given positions on average. */
function getMeanAngle(origin: PlayerPosition, positions: PlayerPosition[]) {
  let x = 0;
  let y = 0;
  for (const position of positions) {
    const distance = Math.hypot(position.x - origin.x, position.y - origin.y) || 1;
    x += (position.x - origin.x) / distance;
    y += (position.y - origin.y) / distance;
  }
  // Players on opposite sides cancel out; fall back to the first one.
  if (Math.hypot(x, y) < 0.01 && positions[0]) {
    return Math.atan2(positions[0].y - origin.y, positions[0].x - origin.x);
  }
  return Math.atan2(y, x);
}

/** Angle offset for item `index` of `count`, fanned evenly around the middle. */
function getSpreadOffset(index: number, count: number, spread: number) {
  return (index - (count - 1) / 2) * spread;
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
