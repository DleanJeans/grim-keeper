import type { Game, Player, PlayerRoleAssignment, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/object-id';
import { getPastEvilTeams, pastEvilGameHasRole } from '@/utils/past-evil-teams-utils';

const roles: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'spy', name: 'Spy', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'gunslinger', name: 'Gunslinger', team: 'traveller' },
];

const script = { id: 'tb', name: 'Trouble Brewing', roles, updatedAt: '', version: '1' };

function assignment(
  kind: PlayerRoleAssignment['kind'],
  day: number,
  roleIds: string[],
): PlayerRoleAssignment {
  return { day, kind, roleIds, updatedAt: `2026-11-0${day}T00:00:00.000Z` };
}

function player(id: string, roleAssignments: PlayerRoleAssignment[]): Player {
  return { id, name: id, roleAssignments, seat: 0 };
}

function game(id: string, createdAt: string, overrides: Partial<Game> = {}): Game {
  return {
    activeDay: 3,
    conversations: [],
    createdAt,
    id,
    players: [],
    script,
    scriptId: 'tb',
    updatedAt: createdAt,
    ...overrides,
  };
}

describe('getPastEvilTeams', () => {
  const current = game('now', '2026-11-05');

  it('lists confirmed evil players with their good claims, newest first', () => {
    const older = game('old', '2026-10-01', {
      players: [
        player('ann', [assignment('claim', 1, ['chef']), assignment('confirm', 3, ['imp'])]),
        player('bo', [assignment('claim', 1, ['empath']), assignment('confirm', 3, ['poisoner'])]),
        player('cy', [assignment('confirm', 3, ['washerwoman'])]),
      ],
    });
    const newer = game('new', '2026-10-20', {
      players: [player('di', [assignment('confirm', 2, ['spy'])])],
    });

    const result = getPastEvilTeams([older, current, newer], current);

    expect(result.games.map((entry) => entry.game.id)).toEqual(['new', 'old']);
    const members = result.games[1].members;
    expect(members.map((member) => [member.player?.name, member.role.name, member.kind])).toEqual([
      ['ann', 'Imp', 'demon'],
      ['bo', 'Poisoner', 'minion'],
    ]);
    expect(members[0].bluffs.map((role) => role.name)).toEqual(['Chef']);
  });

  it('falls back to the In play picker and keeps the Bluffs tokens', () => {
    const past = game('past', '2026-10-01', {
      bluffs: { 'bluff-0': 'chef', 'bluff-1': 'empath' },
      evilInPlay: { 'demon-0': 'imp', 'minion-0': 'spy' },
      players: [player('ann', [assignment('claim', 1, ['chef'])])],
    });

    const [entry] = getPastEvilTeams([past], current).games;

    expect(entry.members.map((member) => [member.player, member.role.name])).toEqual([
      [undefined, 'Imp'],
      [undefined, 'Spy'],
    ]);
    expect(entry.demonBluffs.map((role) => role.name)).toEqual(['Chef', 'Empath']);
  });

  it('marks a good character turned evil and skips other scripts and empty games', () => {
    const turned = game('turned', '2026-10-01', {
      players: [player('ann', [assignment('confirm', 2, ['empath_evil'])])],
    });
    const otherScript = game('other', '2026-10-02', {
      players: [player('bo', [assignment('confirm', 2, ['imp'])])],
      scriptId: 'bmr',
    });
    const empty = game('empty', '2026-10-03');

    const result = getPastEvilTeams([turned, otherScript, empty], current);

    expect(result.games.map((entry) => entry.game.id)).toEqual(['turned']);
    expect(result.games[0].members[0].kind).toBe('turned-evil');
  });

  it('counts Demons, Minions and bluffs once per game, and wins per team', () => {
    const first = game('first', '2026-10-01', {
      players: [
        player(APP_USER_ID, [assignment('confirm', 1, ['chef'])]),
        player('ann', [
          assignment('claim', 1, ['chef']),
          assignment('claim', 2, ['empath', 'chef']),
          assignment('confirm', 3, ['imp']),
        ]),
      ],
      result: 'won',
    });
    const second = game('second', '2026-10-02', {
      players: [
        player(APP_USER_ID, [assignment('confirm', 1, ['poisoner'])]),
        player('bo', [assignment('claim', 1, ['chef']), assignment('confirm', 3, ['imp'])]),
      ],
      result: 'won',
    });
    const unfinished = game('third', '2026-10-03', {
      players: [player('cy', [assignment('confirm', 3, ['imp'])])],
    });

    const result = getPastEvilTeams([first, second, unfinished], current);

    expect(result.demons).toEqual([{ count: 3, role: roles[5] }]);
    expect(result.minions.map((entry) => [entry.role.name, entry.count])).toEqual([
      ['Poisoner', 1],
    ]);
    expect(result.bluffs.map((entry) => [entry.role.name, entry.count])).toEqual([
      ['Chef', 2],
      ['Empath', 1],
    ]);
    expect([result.goodWins, result.evilWins]).toEqual([1, 1]);
    expect(pastEvilGameHasRole(result.games[2], 'empath')).toBe(true);
    expect(pastEvilGameHasRole(result.games[1], 'empath')).toBe(false);
  });
});
