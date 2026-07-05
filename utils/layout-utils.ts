import type { Player, PlayerPosition } from '@/types/game';

const tokenSize = 68;

export function getTokenSize() {
  return tokenSize;
}

export function getPlayerMapPosition(
  player: Player,
  players: Player[],
  mapSize: number,
): PlayerPosition {
  if (player.position) {
    return player.position;
  }

  const center = mapSize / 2;
  const radius = Math.max(0, (mapSize - tokenSize - 28) / 2);
  const sortedPlayers = [...players].sort((first, second) => first.seat - second.seat);
  const index = sortedPlayers.findIndex((candidate) => candidate.id === player.id);
  const angle = (Math.PI * 2 * index) / Math.max(1, sortedPlayers.length) - Math.PI / 2;

  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

export function clampTokenPosition(position: PlayerPosition, mapSize: number): PlayerPosition {
  'worklet';

  const inset = tokenSize / 2;

  return {
    x: Math.min(mapSize - inset, Math.max(inset, position.x)),
    y: Math.min(mapSize - inset, Math.max(inset, position.y)),
  };
}
