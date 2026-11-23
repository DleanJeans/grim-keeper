import type { Player, Role } from '@/types/game';
import { getNightOrderRows } from '@/utils/night-order-utils';

const now = '2026-10-31T00:00:00.000Z';
const roles: Role[] = [
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'saint', name: 'Saint', team: 'outsider' },
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'fang_gu', name: 'Fang Gu', team: 'demon' },
];
const nightSheet = {
  firstNight: ['dusk', 'washerwoman', 'empath'],
  otherNight: ['dusk', 'imp', 'fanggu', 'empath'],
};
const players: Player[] = [
  {
    id: 'a',
    name: 'Ann',
    roleAssignments: [{ day: 1, kind: 'claim', phase: 'day', roleIds: ['empath'], updatedAt: now }],
    seat: 1,
  },
  {
    death: { day: 2, kind: 'night', updatedAt: now },
    id: 'b',
    name: 'Bob',
    roleAssignments: [
      { day: 1, kind: 'claim', phase: 'day', roleIds: ['empath_evil'], updatedAt: now },
    ],
    seat: 2,
  },
];

describe('getNightOrderRows', () => {
  it('uses the first-night order on Night 1, before any claims', () => {
    const rows = getNightOrderRows(roles, players, nightSheet, 1);
    expect(rows.map((row) => row.role.id)).toEqual(['washerwoman', 'empath']);
    expect(rows[1].claimers).toEqual([]);
  });

  it('uses the other-night order later, with claimers and who is dead', () => {
    const rows = getNightOrderRows(roles, players, nightSheet, 2);
    expect(rows.map((row) => row.role.id)).toEqual(['imp', 'fang_gu', 'empath']);
    expect(rows[2].claimers).toEqual([
      { dead: false, diedTonight: false, id: 'a', name: 'Ann' },
      { dead: true, diedTonight: true, id: 'b', name: 'Bob' },
    ]);
  });

  it('marks a character asleep only when all its claimers are dead', () => {
    const rows = getNightOrderRows(roles, players.slice(1), nightSheet, 3);
    expect(rows.map((row) => row.asleep)).toEqual([false, false, true]);
    expect(getNightOrderRows(roles, players, nightSheet, 3)[2].asleep).toBe(false);
  });

  it('keeps trigger-only characters off later nights', () => {
    const extra: Role[] = [
      { id: 'grandmother', name: 'Grandmother', team: 'townsfolk' },
      { id: 'tinker', name: 'Tinker', team: 'townsfolk' },
      { id: 'moonchild', name: 'Moonchild', team: 'townsfolk' },
    ];
    const sheet = {
      firstNight: ['dusk', 'grandmother'],
      otherNight: ['dusk', 'tinker', 'moonchild', 'grandmother'],
    };
    expect(getNightOrderRows(extra, [], sheet, 1).map((row) => row.role.id)).toEqual([
      'grandmother',
    ]);
    expect(getNightOrderRows(extra, [], sheet, 2)).toEqual([]);
  });
});
