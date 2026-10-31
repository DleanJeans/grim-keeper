import type { CharacterTypeCounts, Player, PlayerRoleAssignment, Role } from '@/types/game';
import { getClaimClashes } from '@/utils/claim-clash-utils';

const now = '2026-10-31T00:00:00.000Z';
const counts: CharacterTypeCounts = { demons: 1, minions: 1, outsiders: 1, townsfolk: 5 };
const roles: Role[] = [
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'saint', name: 'Saint', team: 'outsider' },
  { id: 'recluse', name: 'Recluse', team: 'outsider' },
  { id: 'butler', name: 'Butler', team: 'outsider' },
  { id: 'imp', name: 'Imp', team: 'demon' },
];

function assignment(
  kind: PlayerRoleAssignment['kind'],
  roleIds: string[],
  day = 1,
): PlayerRoleAssignment {
  return { day, kind, phase: 'day', roleIds, updatedAt: now };
}

function player(id: string, roleAssignments: PlayerRoleAssignment[], extra: Partial<Player> = {}) {
  return { id, name: id, roleAssignments, seat: 0, ...extra } satisfies Player;
}

describe('getClaimClashes', () => {
  it('finds two players claiming the same character', () => {
    const players = [
      player('a', [assignment('claim', ['chef'])]),
      player('b', [assignment('claim', ['chef'])]),
      player('c', [assignment('claim', ['empath'])]),
      player('st', [assignment('claim', ['chef'])], { isStoryteller: true }),
    ];
    expect(getClaimClashes(players, roles, counts, 1, 'day').doubleClaims).toEqual([
      { playerIds: ['a', 'b'], roleId: 'chef' },
    ]);
  });

  it('uses a confirmed character over the claim and ignores later claims', () => {
    const players = [
      player('a', [assignment('claim', ['chef']), assignment('confirm', ['imp'])]),
      player('b', [assignment('claim', ['chef'])]),
      player('c', [assignment('claim', ['chef'], 2)]),
    ];
    expect(getClaimClashes(players, roles, counts, 1, 'day').doubleClaims).toEqual([]);
  });

  it('ignores generic character types', () => {
    const players = [
      player('a', [assignment('claim', ['generic_outsider'])]),
      player('b', [assignment('claim', ['generic_outsider'])]),
    ];
    const clashes = getClaimClashes(players, roles, counts, 1, 'day');
    expect(clashes.doubleClaims).toEqual([]);
    expect(clashes.outsiders).toEqual({ claimed: 2, maxSetup: 1, modifierRoleIds: [], setup: 1 });
  });

  it('allows extra Outsiders the script could add', () => {
    const players = [
      player('a', [assignment('claim', ['saint'])]),
      player('b', [assignment('claim', ['recluse'])]),
      player('c', [assignment('claim', ['butler'])]),
    ];
    const baron = { id: 'baron', name: 'Baron', team: 'minion' };
    expect(getClaimClashes(players, [...roles, baron], counts, 1, 'day').outsiders).toBeUndefined();
    expect(getClaimClashes(players, roles, counts, 1, 'day').outsiders?.claimed).toBe(3);
    const godfather = { id: 'godfather', name: 'Godfather', team: 'minion' };
    expect(getClaimClashes(players, [...roles, godfather], counts, 1, 'day').outsiders).toEqual({
      claimed: 3,
      maxSetup: 2,
      modifierRoleIds: ['godfather'],
      setup: 1,
    });
  });

  it('flags claims of a bluff or of a character not on the script, but not Travellers', () => {
    const players = [
      player('a', [assignment('claim', ['chef'])]),
      player('b', [assignment('claim', ['clockmaker'])]),
      player('c', [assignment('claim', ['gunslinger'])]),
    ];
    const catalog: Role[] = [
      { id: 'clockmaker', name: 'Clockmaker', team: 'townsfolk' },
      { id: 'gunslinger', name: 'Gunslinger', team: 'traveller' },
    ];
    const clashes = getClaimClashes(players, roles, counts, 1, 'day', {
      bluffRoleIds: ['chef'],
      catalog,
    });
    expect(clashes.bluffClaims).toEqual([{ playerId: 'a', roleId: 'chef' }]);
    expect(clashes.offScriptClaims).toEqual([{ playerId: 'b', roleId: 'clockmaker' }]);
  });
});
