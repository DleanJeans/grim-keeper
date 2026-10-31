import type { Player, Role } from '@/types/game';
import { getGameSummaryText } from '@/utils/game-summary-utils';

const now = '2026-10-31T00:00:00.000Z';
const roles: Role[] = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
];
const players: Player[] = [
  {
    id: 'b',
    name: 'Bob',
    roleAssignments: [{ day: 1, kind: 'claim', phase: 'day', roleIds: ['chef'], updatedAt: now }],
    seat: 2,
  },
  {
    death: { day: 2, killerRoleIds: ['imp'], kind: 'night', updatedAt: now },
    id: 'a',
    name: 'Ann',
    seat: 1,
  },
  { id: 'st', isStoryteller: true, name: 'Story', seat: 0 },
];

describe('getGameSummaryText', () => {
  it('lists players in seat order, then each phase up to the current one', () => {
    const text = getGameSummaryText(
      { conversations: [], players, script: undefined },
      { activeDay: 2, activePhase: 'night', roles, showRoles: true, startingNight: 1 },
    );
    expect(text).toBe(
      [
        'Night 2',
        '',
        'Players',
        '1. Ann, died Night 2',
        '2. Bob, claims Chef',
        '',
        'Day 1',
        '- Bob claimed Chef',
        '',
        'Night 2',
        '- Ann died (Imp)',
      ].join('\n'),
    );
  });

  it('leaves claims out with roles hidden and stops at the current phase', () => {
    const text = getGameSummaryText(
      { conversations: [], players, script: undefined },
      { activeDay: 1, activePhase: 'night', roles, showRoles: false, startingNight: 1 },
    );
    expect(text).toBe(['Night 1', '', 'Players', '1. Ann', '2. Bob'].join('\n'));
  });
});
