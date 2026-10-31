import type { Game, Player } from '@/types/game';

/** A theory's name, built from who is evil in it: "Ann + Bob evil", in seat order. */
export function getTheoryLabel(evilPlayerIds: string[], players: Player[]) {
  const names = players
    .filter((player) => evilPlayerIds.includes(player.id))
    .map((player) => player.name);
  return names.length === 0 ? 'Nobody evil yet' : `${names.join(' + ')} evil`;
}

/** Players evil in the game's active theory; empty when no theory is selected. */
export function getActiveTheoryEvilIds(game: Pick<Game, 'activeTheoryId' | 'theories'>) {
  return game.theories?.find((theory) => theory.id === game.activeTheoryId)?.evilPlayerIds ?? [];
}
