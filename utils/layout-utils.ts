import type { Player, PlayerPosition } from '@/types/game';

export const defaultTokenSize = 68;
export const minTokenSize = 52;
export const maxTokenSize = 92;
export const tokenSizeStep = 8;

export function getTokenSize(tokenSize = defaultTokenSize) {
  'worklet';

  return Math.min(maxTokenSize, Math.max(minTokenSize, tokenSize));
}

export function getPlayerMapPosition(
  player: Player,
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  tokenSize = defaultTokenSize,
): PlayerPosition {
  const resolvedTokenSize = getTokenSize(tokenSize);

  if (player.position) {
    return clampTokenPosition(player.position, mapWidth, mapHeight, resolvedTokenSize);
  }

  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const radius = Math.max(0, (Math.min(mapWidth, mapHeight) - resolvedTokenSize - 28) / 2);
  const sortedPlayers = [...players].sort((first, second) => first.seat - second.seat);
  const index = sortedPlayers.findIndex((candidate) => candidate.id === player.id);
  const angle = (Math.PI * 2 * index) / Math.max(1, sortedPlayers.length) - Math.PI / 2;

  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

export function clampTokenPosition(
  position: PlayerPosition,
  mapWidth: number,
  mapHeight: number,
  tokenSize = defaultTokenSize,
): PlayerPosition {
  'worklet';

  const inset = getTokenSize(tokenSize) / 2;
  const maxX = Math.max(inset, mapWidth - inset);
  const maxY = Math.max(inset, mapHeight - inset);

  return {
    x: Math.min(maxX, Math.max(inset, position.x)),
    y: Math.min(maxY, Math.max(inset, position.y)),
  };
}

export function rotatePlayerMapPositions(
  players: Player[],
  mapWidth: number,
  mapHeight: number,
  angleRadians: number,
  tokenSize = defaultTokenSize,
): Record<string, PlayerPosition> {
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const cos = Math.cos(angleRadians);
  const sin = Math.sin(angleRadians);

  return Object.fromEntries(
    players.map((player) => {
      const position = getPlayerMapPosition(player, players, mapWidth, mapHeight, tokenSize);
      const relativeX = position.x - centerX;
      const relativeY = position.y - centerY;

      return [
        player.id,
        clampTokenPosition(
          {
            x: centerX + relativeX * cos - relativeY * sin,
            y: centerY + relativeX * sin + relativeY * cos,
          },
          mapWidth,
          mapHeight,
          tokenSize,
        ),
      ];
    }),
  );
}
