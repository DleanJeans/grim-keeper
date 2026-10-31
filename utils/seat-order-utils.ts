/**
 * Moves a player into a gap of the seat list. Gap 0 is before the first player and gap
 * `items.length` is after the last one; gaps are counted in the list before the move.
 */
export function movePlayerToGap<T extends { id: string }>(
  items: T[],
  playerId: string,
  gapIndex: number,
): T[] {
  const fromIndex = items.findIndex((item) => item.id === playerId);
  if (fromIndex === -1 || gapIndex < 0 || gapIndex > items.length) {
    return items;
  }

  const toIndex = gapIndex > fromIndex ? gapIndex - 1 : gapIndex;
  if (toIndex === fromIndex) {
    return items;
  }

  const nextItems = items.filter((item) => item.id !== playerId);
  nextItems.splice(toIndex, 0, items[fromIndex]);
  return nextItems;
}

/** Swaps the seats of two players. */
export function swapPlayers<T extends { id: string }>(
  items: T[],
  firstId: string,
  secondId: string,
): T[] {
  const firstIndex = items.findIndex((item) => item.id === firstId);
  const secondIndex = items.findIndex((item) => item.id === secondId);
  if (firstIndex === -1 || secondIndex === -1 || firstIndex === secondIndex) {
    return items;
  }

  const nextItems = [...items];
  nextItems[firstIndex] = items[secondIndex];
  nextItems[secondIndex] = items[firstIndex];
  return nextItems;
}

/** Whether moving the player into this gap would leave the seats as they are. */
export function isNoOpGap<T extends { id: string }>(
  items: T[],
  playerId: string,
  gapIndex: number,
) {
  const fromIndex = items.findIndex((item) => item.id === playerId);
  return fromIndex === -1 || gapIndex === fromIndex || gapIndex === fromIndex + 1;
}
