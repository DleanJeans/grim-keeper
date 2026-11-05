import type { Player } from '@/types/game';
import { getClaimsToConfirm } from '@/utils/claim-confirm-utils';

function player(id: string, overrides: Partial<Player> = {}): Player {
  return { id, name: id.toUpperCase(), ...overrides } as Player;
}

describe('getClaimsToConfirm', () => {
  it('lists single claims without a confirm, skipping multi-claims and confirmed players', () => {
    const players = [
      player('ann', {
        roleAssignments: [
          { day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' },
          { day: 3, kind: 'confirm', roleIds: ['imp'], updatedAt: 'x' },
        ],
      }),
      player('bob', {
        roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: 'x' }],
      }),
      player('cat', {
        roleAssignments: [{ day: 2, kind: 'claim', roleIds: ['chef', 'empath'], updatedAt: 'x' }],
      }),
      player('dan', {
        isStoryteller: true,
        roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' }],
      }),
    ] as Player[];

    expect(getClaimsToConfirm({ players }, 3, 'day')).toEqual([
      { playerId: 'bob', roleId: 'empath' },
    ]);
  });
});
