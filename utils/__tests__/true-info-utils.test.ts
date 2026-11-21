import type { Player, Role } from '@/types/game';
import { getTrueEmpathInfo } from '@/utils/true-info-utils';

const roles = [
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
] as Role[];

function makePlayer(id: string, seat: number, roleId: string, extra: Partial<Player> = {}): Player {
  return {
    id,
    name: id,
    seat,
    roleAssignments: [{ day: 1, kind: 'confirm', roleIds: [roleId], updatedAt: '' }],
    ...extra,
  } as Player;
}

describe('getTrueEmpathInfo', () => {
  const players = [
    makePlayer('a', 1, 'imp'),
    makePlayer('b', 2, 'empath'),
    makePlayer('c', 3, 'chef'),
  ];

  it('counts evil alive neighbours from the confirmed characters', () => {
    expect(getTrueEmpathInfo({ day: 1, ownerId: 'b', phase: 'night', players, roles })).toEqual({
      '0': '1',
    });
  });

  it('gives nothing when the Empath is drunk or poisoned', () => {
    for (const kind of ['drunk', 'poisoned']) {
      const marked = players.map((player) =>
        player.id === 'b' ? { ...player, statuses: [{ day: 1, kind }] } : player,
      );
      expect(
        getTrueEmpathInfo({ day: 1, ownerId: 'b', phase: 'night', players: marked, roles }),
      ).toBeUndefined();
    }
  });

  it('gives nothing while a neighbour has no confirmed character', () => {
    const open = players.map((player) =>
      player.id === 'c' ? { ...player, roleAssignments: [] } : player,
    );
    expect(
      getTrueEmpathInfo({ day: 1, ownerId: 'b', phase: 'night', players: open, roles }),
    ).toBeUndefined();
  });
});
