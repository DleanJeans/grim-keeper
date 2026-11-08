import type { FakeEvilTeam, Player, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import {
  canFakeRoleInfo,
  cycleFakeTeamRole,
  getFakeEvilIds,
  getFakeRoleInfoValues,
  rollFakeEvilTeam,
} from '@/utils/fake-info-utils';

function makePlayer(id: string, seat: number, overrides: Partial<Player> = {}): Player {
  return { id, name: id.toUpperCase(), seat, ...overrides };
}

const ROLES: Role[] = [
  { id: 'washerwoman', name: 'Washerwoman', team: 'townsfolk' },
  { id: 'chef', name: 'Chef', team: 'townsfolk' },
  { id: 'empath', name: 'Empath', team: 'townsfolk' },
  { id: 'butler', name: 'Butler', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'spy', name: 'Spy', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
];

// Seats: you(0) a(1) b(2) c(3) d(4) e(5)
const PLAYERS = [
  makePlayer(APP_USER_ID, 0),
  makePlayer('a', 1),
  makePlayer('b', 2),
  makePlayer('c', 3),
  makePlayer('d', 4),
  makePlayer('e', 5),
  makePlayer('st', 6, { isStoryteller: true }),
];

const TEAM: FakeEvilTeam = { demonId: 'a', minionIds: ['b'], redHerringId: 'd' };

const context = (overrides: Partial<Parameters<typeof getFakeRoleInfoValues>[1]> = {}) => ({
  day: 1,
  ownerId: APP_USER_ID,
  phase: 'night' as const,
  players: PLAYERS,
  random: () => 0,
  roles: ROLES,
  team: TEAM,
  ...overrides,
});

describe('fake info', () => {
  it('knows which characters it can fake', () => {
    expect(canFakeRoleInfo({ id: 'empath' })).toBe(true);
    expect(canFakeRoleInfo({ id: 'monk' })).toBe(false);
  });

  it('counts the evil neighbours for the Empath', () => {
    // You sit between e and a; a is the fake Demon.
    expect(getFakeRoleInfoValues({ id: 'empath' }, context())).toEqual({ '0': '1' });
    expect(getFakeRoleInfoValues({ id: 'empath' }, context({ ownerId: 'c' }))).toEqual({
      '0': '1',
    });
    expect(getFakeRoleInfoValues({ id: 'empath' }, context({ ownerId: 'e' }))).toEqual({
      '0': '0',
    });
  });

  it('counts evil pairs sitting together for the Chef', () => {
    expect(getFakeRoleInfoValues({ id: 'chef' }, context())).toEqual({ '0': '1' });
    expect(
      getFakeRoleInfoValues({ id: 'chef' }, context({ team: { demonId: 'a', minionIds: ['c'] } })),
    ).toEqual({ '0': '0' });
  });

  it('gives the Fortune Teller the red herring and a Yes', () => {
    const values = getFakeRoleInfoValues({ id: 'fortuneteller' }, context());
    expect(values?.['2']).toBe('Yes');
    expect([values?.['0'], values?.['1']]).toContain('d');
    expect(values?.['0']).not.toBe(values?.['1']);
  });

  it('points the Investigator at the fake Minion', () => {
    const values = getFakeRoleInfoValues({ id: 'investigator' }, context());
    expect(['poisoner', 'spy']).toContain(values?.['0']);
    expect([values?.['1'], values?.['2']]).toContain('b');
  });

  it('uses the In play Minion for the Investigator', () => {
    const values = getFakeRoleInfoValues(
      { id: 'investigator' },
      context({ inPlayRoleIds: { minion: new Set(['spy']) } }),
    );
    expect(values?.['0']).toBe('spy');
  });

  it('backs up a good townsfolk claim for the Washerwoman', () => {
    const players = PLAYERS.map((player) =>
      player.id === 'c'
        ? {
            ...player,
            roleAssignments: [{ day: 1, kind: 'claim' as const, roleIds: ['chef'], updatedAt: '' }],
          }
        : player,
    );
    const values = getFakeRoleInfoValues({ id: 'washerwoman' }, context({ players }));
    expect(values?.['0']).toBe('chef');
    expect([values?.['1'], values?.['2']]).toContain('c');
  });

  it('counts seats from the Demon to the nearest Minion for the Clockmaker', () => {
    expect(getFakeRoleInfoValues({ id: 'clockmaker' }, context())).toEqual({ '0': '1' });
    expect(
      getFakeRoleInfoValues(
        { id: 'clockmaker' },
        context({ team: { demonId: 'a', minionIds: ['d'] } }),
      ),
    ).toEqual({ '0': '3' });
  });

  it('shows the fake character of an executed fake evil player to the Undertaker', () => {
    expect(getFakeRoleInfoValues({ id: 'undertaker' }, context({ executed: PLAYERS[1] }))).toEqual({
      '0': 'imp',
    });
    expect(getFakeRoleInfoValues({ id: 'undertaker' }, context())).toBeUndefined();
  });

  it('needs a fake evil team', () => {
    expect(
      getFakeRoleInfoValues({ id: 'empath' }, context({ team: { minionIds: [] } })),
    ).toBeUndefined();
  });

  it('rolls a team of other players with a red herring', () => {
    const team = rollFakeEvilTeam(PLAYERS, 2, () => 0);
    const ids = [...getFakeEvilIds(team), team.redHerringId];
    expect(team.minionIds).toHaveLength(2);
    expect(new Set(ids).size).toBe(4);
    expect(ids).not.toContain(APP_USER_ID);
    expect(ids).not.toContain('st');
  });

  it('cycles a tapped player through Demon, Minion, red herring and none', () => {
    const demon = cycleFakeTeamRole(undefined, 'a');
    expect(demon).toEqual({ demonId: 'a', minionIds: [], redHerringId: undefined });
    const minion = cycleFakeTeamRole(demon, 'a');
    expect(minion).toEqual({ demonId: undefined, minionIds: ['a'], redHerringId: undefined });
    const herring = cycleFakeTeamRole(minion, 'a');
    expect(herring).toEqual({ demonId: undefined, minionIds: [], redHerringId: 'a' });
    expect(cycleFakeTeamRole(herring, 'a')).toEqual({
      demonId: undefined,
      minionIds: [],
      redHerringId: undefined,
    });
    // A new Demon moves the old one to Minion.
    expect(cycleFakeTeamRole(demon, 'b')).toEqual({
      demonId: 'b',
      minionIds: ['a'],
      redHerringId: undefined,
    });
  });
});
