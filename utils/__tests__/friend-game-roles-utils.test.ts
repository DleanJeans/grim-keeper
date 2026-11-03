import type { Player, PlayerRoleAssignment, Role } from '@/types/game';
import { getFriendGameRoles } from '@/utils/friend-game-roles-utils';

const roles: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'damsel', name: 'Damsel', team: 'outsider' },
  { id: 'lunatic', name: 'Lunatic', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'gunslinger', name: 'Gunslinger', team: 'traveller' },
];

function assignment(
  kind: PlayerRoleAssignment['kind'],
  day: number,
  roleIds: string[],
  updatedAt = `2026-11-0${day}T00:00:00.000Z`,
): PlayerRoleAssignment {
  return { day, kind, roleIds, updatedAt };
}

function player(roleAssignments: PlayerRoleAssignment[]): Player {
  return { id: 'p1', name: 'Ann', roleAssignments } as Player;
}

function names(stages: Role[][]) {
  return stages.map((stage) => stage.map((role) => role.name));
}

describe('getFriendGameRoles', () => {
  it('treats claims as the character when nothing was confirmed', () => {
    const result = getFriendGameRoles(player([assignment('claim', 1, ['empath'])]), roles);

    expect(names(result.characters)).toEqual([['Empath']]);
    expect(result.claims).toEqual([]);
  });

  it('labels good claims of an evil player as bluffs', () => {
    const result = getFriendGameRoles(
      player([assignment('claim', 1, ['washerwoman']), assignment('confirm', 2, ['imp'])]),
      roles,
    );

    expect(names(result.characters)).toEqual([['Imp']]);
    expect(result.claimLabel).toBe('Bluffed as');
    expect(result.claims.map((role) => role.name)).toEqual(['Washerwoman']);
  });

  it('counts a good role turned evil as evil', () => {
    const result = getFriendGameRoles(
      player([assignment('claim', 1, ['chef']), assignment('confirm', 2, ['empath_evil'])]),
      roles,
    );

    expect(result.claimLabel).toBe('Bluffed as');
  });

  it('keeps Claimed for a good player and for evil claims', () => {
    const good = getFriendGameRoles(
      player([assignment('claim', 1, ['imp']), assignment('confirm', 2, ['lunatic'])]),
      roles,
    );
    const evilClaim = getFriendGameRoles(
      player([assignment('claim', 1, ['imp']), assignment('confirm', 2, ['poisoner'])]),
      roles,
    );

    expect(good.claimLabel).toBe('Claimed');
    expect(evilClaim.claimLabel).toBe('Claimed');
  });

  it('hides claims that match a character', () => {
    const result = getFriendGameRoles(
      player([assignment('claim', 1, ['chef']), assignment('confirm', 1, ['chef'])]),
      roles,
    );

    expect(result.claims).toEqual([]);
  });

  it('lists each confirmed character change in order', () => {
    const result = getFriendGameRoles(
      player([
        assignment('confirm', 1, ['damsel']),
        assignment('confirm', 2, ['damsel']),
        assignment('confirm', 3, ['chef']),
        assignment('claim', 1, ['damsel']),
      ]),
      roles,
    );

    expect(names(result.characters)).toEqual([['Damsel'], ['Chef']]);
    expect(result.claims).toEqual([]);
  });

  it('uses the latest confirm of a phase, so a corrected pick is not a change', () => {
    const result = getFriendGameRoles(
      player([
        assignment('confirm', 1, ['chef'], '2026-11-01T00:00:00.000Z'),
        assignment('confirm', 1, ['empath'], '2026-11-01T01:00:00.000Z'),
      ]),
      roles,
    );

    expect(names(result.characters)).toEqual([['Empath']]);
  });

  it('leaves out claims for Travellers', () => {
    const result = getFriendGameRoles(
      player([assignment('claim', 1, ['chef']), assignment('confirm', 1, ['gunslinger'])]),
      roles,
    );

    expect(result.claims).toEqual([]);
  });
});
