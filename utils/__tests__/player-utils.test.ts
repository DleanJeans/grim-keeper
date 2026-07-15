import type { Player, PlayerDeath, PlayerRevive } from '@/types/game';
import { hasDeadVoteAvailable, isPlayerCurrentlyDead } from '@/utils/player-utils';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    seat: 0,
    ...overrides,
  };
}

function makeDeath(day: number, kind: 'execution' | 'night' = 'night'): PlayerDeath {
  return { day, kind, updatedAt: '2026-01-01T00:00:00.000Z' };
}

function makeRevive(day: number): PlayerRevive {
  return { day, updatedAt: '2026-01-01T00:00:00.000Z' };
}

describe('isPlayerCurrentlyDead', () => {
  it('returns false for a player with no death record', () => {
    expect(isPlayerCurrentlyDead(makePlayer(), 3)).toBe(false);
  });

  it('returns true for a player whose death is on or before the active day', () => {
    const player = makePlayer({ death: makeDeath(2) });
    expect(isPlayerCurrentlyDead(player, 2)).toBe(true);
    expect(isPlayerCurrentlyDead(player, 3)).toBe(true);
  });

  it('returns false for a player whose death is in the future', () => {
    const player = makePlayer({ death: makeDeath(4) });
    expect(isPlayerCurrentlyDead(player, 2)).toBe(false);
  });

  it('returns false for a player who was revived on the same day they died', () => {
    const player = makePlayer({ death: makeDeath(2), revive: makeRevive(2) });
    expect(isPlayerCurrentlyDead(player, 2)).toBe(false);
  });

  it('returns false for a player who was revived after their death', () => {
    const player = makePlayer({ death: makeDeath(2, 'execution'), revive: makeRevive(3) });
    expect(isPlayerCurrentlyDead(player, 2)).toBe(true);
    expect(isPlayerCurrentlyDead(player, 3)).toBe(false);
    expect(isPlayerCurrentlyDead(player, 4)).toBe(false);
  });
});

describe('hasDeadVoteAvailable', () => {
  it('returns true for a dead player who has not used their dead vote', () => {
    expect(hasDeadVoteAvailable(makePlayer({ death: makeDeath(2) }), 2)).toBe(true);
  });

  it('returns false after the dead vote is used', () => {
    expect(hasDeadVoteAvailable(makePlayer({ death: makeDeath(2), deadVoteUsed: true }), 2)).toBe(
      false,
    );
  });

  it('returns false for a living or revived player', () => {
    expect(hasDeadVoteAvailable(makePlayer(), 2)).toBe(false);
    expect(
      hasDeadVoteAvailable(makePlayer({ death: makeDeath(2), revive: makeRevive(3) }), 3),
    ).toBe(false);
  });
});
