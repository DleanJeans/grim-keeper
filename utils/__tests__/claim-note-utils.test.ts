import type { Player, Role } from '@/types/game';
import { getClaimNoteDrafts } from '@/utils/claim-note-utils';

const roles = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'imp', name: 'Imp', team: 'demon' },
] as Role[];

function player(id: string, overrides: Partial<Player> = {}): Player {
  return { id, name: id.toUpperCase(), ...overrides } as Player;
}

describe('getClaimNoteDrafts', () => {
  it('drafts a note per claimer with the confirmed character when known', () => {
    const players = [
      player('app-user', {
        roleAssignments: [{ day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' }],
      }),
      player('ann', {
        roleAssignments: [
          { day: 1, kind: 'claim', roleIds: ['chef'], updatedAt: 'x' },
          { day: 3, kind: 'confirm', roleIds: ['imp'], updatedAt: 'x' },
        ],
      }),
      player('bob', {
        roleAssignments: [
          { day: 1, kind: 'claim', roleIds: ['empath'], updatedAt: 'x' },
          { day: 2, kind: 'confirm', roleIds: ['empath'], updatedAt: 'x' },
        ],
      }),
      player('cat', {
        roleAssignments: [{ day: 2, kind: 'claim', roleIds: ['chef', 'empath'], updatedAt: 'x' }],
      }),
      player('dan'),
    ] as Player[];

    expect(getClaimNoteDrafts({ players }, roles, 3, 'day')).toEqual([
      {
        playerId: 'ann',
        playerName: 'ANN',
        roleIds: ['chef', 'imp'],
        text: 'Claimed Chef. Was really the Imp.',
      },
      {
        playerId: 'bob',
        playerName: 'BOB',
        roleIds: ['empath'],
        text: 'Claimed Empath. It was true.',
      },
      {
        playerId: 'cat',
        playerName: 'CAT',
        roleIds: ['chef', 'empath'],
        text: 'Claimed Chef or Empath.',
      },
    ]);
  });
});
