import type { Player, PlayerPosition } from '@/types/game';

export const defaultTokenSize = 68;
export const minTokenSize = 40;
export const maxTokenSize = 100;
export const tokenSizeStep = 2;

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

  const sortedPlayers = [...players].sort((first, second) => first.seat - second.seat);
  const index = sortedPlayers.findIndex((candidate) => candidate.id === player.id);
  const inset = resolvedTokenSize / 2;
  const left = Math.min(inset, mapWidth / 2);
  const right = Math.max(left, mapWidth - inset);
  const top = Math.min(inset, mapHeight / 2);
  const bottom = Math.max(top, mapHeight - inset);
  const width = right - left;
  const height = bottom - top;
  const perimeter = 2 * (width + height);

  if (perimeter === 0) {
    return { x: left, y: top };
  }

  const bottomCenterOffset = width * 1.5 + height;
  const offset =
    (bottomCenterOffset + (perimeter * Math.max(0, index)) / Math.max(1, sortedPlayers.length)) %
    perimeter;

  if (offset <= width) {
    return { x: left + offset, y: top };
  }

  if (offset <= width + height) {
    return { x: right, y: top + offset - width };
  }

  if (offset <= 2 * width + height) {
    return { x: right - (offset - width - height), y: bottom };
  }

  return {
    x: left,
    y: bottom - (offset - 2 * width - height),
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
