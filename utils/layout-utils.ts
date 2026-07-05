import type { Player, PlayerPosition } from '@/types/game';

const tokenSize = 68;

export function getTokenSize() {
  return tokenSize;
}

export function getPlayerMapPosition(
  player: Player,
  players: Player[],
  mapWidth: number,
  mapHeight: number,
): PlayerPosition {
  if (player.position) {
    return clampTokenPosition(player.position, mapWidth, mapHeight);
  }

  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  const radius = Math.max(0, (Math.min(mapWidth, mapHeight) - tokenSize - 28) / 2);
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
): PlayerPosition {
  'worklet';

  const inset = tokenSize / 2;
  const maxX = Math.max(inset, mapWidth - inset);
  const maxY = Math.max(inset, mapHeight - inset);

  return {
    x: Math.min(maxX, Math.max(inset, position.x)),
    y: Math.min(maxY, Math.max(inset, position.y)),
  };
}
