import type { Game, Player } from '@/types/game';
import {
  getAdjacentPhasePosition,
  getDayCutoffForPhase,
  getDeathPhase,
  getEventPhaseIndex,
  getGameActivePhase,
  getGameStartingNight,
  getLatestPhaseWithData,
  getPhaseIndex,
  getPhaseLabel,
  getPhasePositionAtIndex,
} from '@/utils/game-phase-utils';

const UPDATED_AT = '2026-01-01T00:00:00.000Z';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    seat: 0,
    ...overrides,
  };
}

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1',
    createdAt: UPDATED_AT,
    updatedAt: UPDATED_AT,
    activeDay: 1,
    players: [makePlayer()],
    conversations: [],
    ...overrides,
  };
}

describe('phase indexes', () => {
  it('orders Night N before Day N', () => {
    expect(getPhaseIndex({ activeDay: 1, activePhase: 'night' })).toBe(0);
    expect(getPhaseIndex({ activeDay: 1, activePhase: 'day' })).toBe(1);
    expect(getPhaseIndex({ activeDay: 2, activePhase: 'night' })).toBe(2);
    expect(getPhaseIndex({ activeDay: 3, activePhase: 'day' })).toBe(5);
  });

  it('round-trips between positions and indexes', () => {
    for (let index = 0; index < 10; index += 1) {
      const position = getPhasePositionAtIndex(index);
      expect(getPhaseIndex(position)).toBe(index);
      expect(getEventPhaseIndex(position.activeDay, position.activePhase)).toBe(index);
    }
  });

  it('steps to the neighbouring phase', () => {
    expect(getAdjacentPhasePosition({ activeDay: 1, activePhase: 'night' }, 1)).toEqual({
      activeDay: 1,
      activePhase: 'day',
    });
    expect(getAdjacentPhasePosition({ activeDay: 2, activePhase: 'night' }, -1)).toEqual({
      activeDay: 1,
      activePhase: 'day',
    });
  });

  it('counts the days that have started by the given phase', () => {
    expect(getDayCutoffForPhase({ activeDay: 1, activePhase: 'night' })).toBe(0);
    expect(getDayCutoffForPhase({ activeDay: 1, activePhase: 'day' })).toBe(1);
    expect(getDayCutoffForPhase({ activeDay: 2, activePhase: 'night' })).toBe(1);
  });
});

describe('getPhaseLabel', () => {
  it('labels nights from the starting night without shifting days', () => {
    expect(getPhaseLabel({ activeDay: 1, activePhase: 'night' }, 1)).toBe('Night 1');
    expect(getPhaseLabel({ activeDay: 1, activePhase: 'night' }, 0)).toBe('Night 0');
    expect(getPhaseLabel({ activeDay: 2, activePhase: 'night' }, 0)).toBe('Night 1');
    expect(getPhaseLabel({ activeDay: 2, activePhase: 'day' }, 0)).toBe('Day 2');
  });
});

describe('legacy game fields', () => {
  it('treats a missing phase as Day and a missing starting night as Night 1', () => {
    expect(getGameActivePhase({})).toBe('day');
    expect(getGameActivePhase({ activePhase: 'night' })).toBe('night');
    expect(getGameStartingNight({})).toBe(1);
    expect(getGameStartingNight({ startingNight: 0 })).toBe(0);
  });
});

describe('getDeathPhase', () => {
  it('puts executions and Witch kills on the Day', () => {
    expect(getDeathPhase({ kind: 'execution' })).toBe('day');
    expect(getDeathPhase({ kind: 'night', killerRoleIds: ['witch'] })).toBe('day');
    expect(getDeathPhase({ kind: 'night', killerRoleIds: ['imp'] })).toBe('night');
  });
});

describe('getLatestPhaseWithData', () => {
  it('falls back to the stored phase when the game has no data', () => {
    expect(getLatestPhaseWithData(makeGame({ activeDay: 2, activePhase: 'night' }))).toEqual({
      activeDay: 2,
      activePhase: 'night',
    });
  });

  it('returns the latest phase across notes, role info, assignments and deaths', () => {
    const game = makeGame({
      playerDayNotes: [
        { day: 1, phase: 'night', playerId: 'p1', notes: [], updatedAt: UPDATED_AT },
      ],
      roleInfos: [{ roleId: 'empath', day: 2, phase: 'night', values: {}, updatedAt: UPDATED_AT }],
      players: [
        makePlayer({
          death: { day: 2, kind: 'execution', updatedAt: UPDATED_AT },
        }),
        makePlayer({
          id: 'p2',
          death: { day: 3, kind: 'night', updatedAt: UPDATED_AT },
        }),
      ],
    });

    expect(getLatestPhaseWithData(game)).toEqual({ activeDay: 3, activePhase: 'night' });
  });

  it('reads legacy notes without a phase as Day notes', () => {
    const game = makeGame({
      playerDayNotes: [{ day: 2, playerId: 'p1', notes: [], updatedAt: UPDATED_AT }],
    });

    expect(getLatestPhaseWithData(game)).toEqual({ activeDay: 2, activePhase: 'day' });
  });
});
