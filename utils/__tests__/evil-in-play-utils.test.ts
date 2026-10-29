import type { Player, Role } from '@/types/game';
import {
  getBluffSlots,
  getEvilInPlayRoleIds,
  getEvilInPlaySlots,
  getGameEvilInPlaySlots,
  getPlayersWithoutClaims,
  getUnclaimedRoles,
  setEvilInPlayRole,
} from '@/utils/evil-in-play-utils';

const role = (id: string, team: string): Role => ({ id, name: id, team }) as Role;

const TROUBLE_BREWING = [
  role('washerwoman', 'townsfolk'),
  role('poisoner', 'minion'),
  role('spy', 'minion'),
  role('baron', 'minion'),
  role('imp', 'demon'),
];
const BAD_MOON_RISING = [
  role('godfather', 'minion'),
  role('po', 'demon'),
  role('zombuul', 'demon'),
];

const counts = (minions: number, demons = 1) => ({ demons, minions, outsiders: 0, townsfolk: 5 });

describe('getEvilInPlaySlots', () => {
  it('locks the Demon slot to the script’s only Demon', () => {
    expect(getEvilInPlaySlots(TROUBLE_BREWING, counts(2), { 'demon-0': 'other' })).toEqual([
      { locked: true, roleId: 'imp', slotId: 'demon-0', team: 'demon' },
      { locked: false, roleId: undefined, slotId: 'minion-0', team: 'minion' },
      { locked: false, roleId: undefined, slotId: 'minion-1', team: 'minion' },
    ]);
  });

  it('fills chosen characters and ignores ones not on the script', () => {
    const slots = getEvilInPlaySlots(BAD_MOON_RISING, counts(1), {
      'demon-0': 'po',
      'minion-0': 'baron',
    });
    expect(slots.map((slot) => [slot.slotId, slot.roleId, slot.locked])).toEqual([
      ['demon-0', 'po', false],
      ['minion-0', undefined, false],
    ]);
  });
});

describe('getEvilInPlayRoleIds', () => {
  it('limits only the teams with a chosen character', () => {
    const roleIds = getEvilInPlayRoleIds(
      getEvilInPlaySlots(TROUBLE_BREWING, counts(2), { 'minion-1': 'spy' }),
    );
    expect(roleIds.get('demon')).toEqual(new Set(['imp']));
    expect(roleIds.get('minion')).toEqual(new Set(['spy']));
    expect(
      getEvilInPlayRoleIds(getEvilInPlaySlots(BAD_MOON_RISING, counts(1), undefined)).size,
    ).toBe(0);
  });
});

describe('getGameEvilInPlaySlots', () => {
  it('sizes slots from the standard setup without travellers or the storyteller', () => {
    const players = Array.from(
      { length: 12 },
      (_, index) =>
        ({
          id: `p${index}`,
          isStoryteller: index === 0,
          roleAssignments:
            index === 1 ? [{ day: 1, kind: 'claim', roleIds: ['thief'] }] : undefined,
        }) as unknown as Player,
    );
    const slots = getGameEvilInPlaySlots({ players }, [
      ...TROUBLE_BREWING,
      role('thief', 'traveller'),
    ]);
    // 10 players: 2 Minions.
    expect(slots.filter((slot) => slot.team === 'minion')).toHaveLength(2);
  });
});

describe('setEvilInPlayRole', () => {
  it('sets and clears a slot', () => {
    const chosen = setEvilInPlayRole(undefined, 'minion-0', 'spy');
    expect(chosen).toEqual({ 'minion-0': 'spy' });
    expect(setEvilInPlayRole(chosen, 'minion-0', undefined)).toBeUndefined();
  });
});

describe('getBluffSlots', () => {
  it('gives 3 slots that keep only good characters from the script', () => {
    expect(
      getBluffSlots(TROUBLE_BREWING, {
        'bluff-0': 'washerwoman',
        'bluff-1': 'imp',
        'bluff-2': 'x',
      }),
    ).toEqual([
      { locked: false, roleId: 'washerwoman', slotId: 'bluff-0', team: 'bluff' },
      { locked: false, roleId: undefined, slotId: 'bluff-1', team: 'bluff' },
      { locked: false, roleId: undefined, slotId: 'bluff-2', team: 'bluff' },
    ]);
  });
});

const player = (
  id: string,
  seat: number,
  roleAssignments?: Player['roleAssignments'],
  isStoryteller?: boolean,
) => ({ id, isStoryteller, name: id, roleAssignments, seat }) as unknown as Player;
const assignment = (
  kind: 'claim' | 'confirm' | 'guess',
  roleIds: string[],
  day = 1,
): NonNullable<Player['roleAssignments']>[number] => ({
  day,
  kind,
  phase: 'day',
  roleIds,
  updatedAt: `2026-01-0${day}`,
});

describe('getUnclaimedRoles', () => {
  const roles = [
    role('washerwoman', 'townsfolk'),
    role('chef', 'townsfolk'),
    role('empath', 'townsfolk'),
    role('monk', 'townsfolk'),
    role('drunk', 'outsider'),
    role('saint', 'outsider'),
    role('spy', 'minion'),
    role('imp', 'demon'),
  ];

  it('leaves out claimed, confirmed and bluffed good characters', () => {
    const players = [
      player('a', 1, [assignment('claim', ['chef'])]),
      player('b', 2, [assignment('confirm', ['washerwoman_evil'])]),
      player('c', 3, [assignment('guess', ['empath'])]),
    ];
    const unclaimed = getUnclaimedRoles(roles, players, { 'bluff-0': 'saint' }, 1, 'day');
    expect(unclaimed.map((entry) => entry.id)).toEqual(['empath', 'monk', 'drunk']);
  });

  it('ignores claims made after the active phase', () => {
    const players = [player('a', 1, [assignment('claim', ['chef'], 2)])];
    const unclaimed = getUnclaimedRoles(roles, players, undefined, 1, 'day');
    expect(unclaimed.map((entry) => entry.id)).toContain('chef');
  });
});

describe('getPlayersWithoutClaims', () => {
  it('lists players with no claim or confirm by seat, Storytellers excluded', () => {
    const players = [
      player('c', 3),
      player('st', 0, undefined, true),
      player('a', 1, [assignment('claim', ['chef'])]),
      player('b', 2, [assignment('guess', ['empath'])]),
      player('d', 4, [assignment('claim', ['monk'], 2)]),
    ];
    expect(getPlayersWithoutClaims(players, 1, 'day').map((entry) => entry.id)).toEqual([
      'b',
      'c',
      'd',
    ]);
  });
});
