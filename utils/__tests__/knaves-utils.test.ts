import type { Player, RoleInfoEntry } from '@/types/game';
import {
  getKnavesLiarId,
  getKnavesStorytellers,
  getKnavesVerdict,
  getLastStorytellerId,
  getNextStorytellerId,
  hasKnaves,
} from '@/utils/knaves-utils';
import { mapRoleInfoPlayerIds, ROLE_INFO_STORYTELLER_KEY } from '@/utils/role-info-utils';

const ben = { id: 'ben', isStoryteller: true, name: 'Ben', seat: 5 } as Player;
const lachlan = { id: 'lachlan', isStoryteller: true, name: 'Lachlan', seat: 6 } as Player;
const ava = { id: 'ava', name: 'Ava', seat: 0 } as Player;
const storytellers = [ben, lachlan];

function entry(day: number, phase: 'day' | 'night', values: Record<string, string>) {
  return { day, phase, roleId: 'empath', updatedAt: '', values } as RoleInfoEntry;
}

describe('knaves utils', () => {
  it('finds the Knaves Loric by id', () => {
    expect(hasKnaves(['knaves'])).toBe(true);
    expect(hasKnaves(['bigwig'])).toBe(false);
    expect(hasKnaves(undefined)).toBe(false);
  });

  it('only lists Storytellers with the Knaves and at least two of them', () => {
    expect(getKnavesStorytellers({ lorics: ['knaves'], players: [ava, ben, lachlan] })).toEqual(
      storytellers,
    );
    expect(getKnavesStorytellers({ lorics: ['knaves'], players: [ava, ben] })).toEqual([]);
    expect(getKnavesStorytellers({ lorics: [], players: [ava, ben, lachlan] })).toEqual([]);
  });

  it('cycles from none through each Storyteller back to none', () => {
    expect(getNextStorytellerId(storytellers, undefined)).toBe('ben');
    expect(getNextStorytellerId(storytellers, 'ben')).toBe('lachlan');
    expect(getNextStorytellerId(storytellers, 'lachlan')).toBeUndefined();
  });

  it('flips the liar after the dusk they switched at', () => {
    const guess = { knavesLiarId: 'lachlan', knavesSwitchDay: 2 };
    expect(getKnavesLiarId(guess, storytellers, 1)).toBe('lachlan');
    // Day 2's own info came before its dusk.
    expect(getKnavesLiarId(guess, storytellers, 2)).toBe('lachlan');
    expect(getKnavesLiarId(guess, storytellers, 3)).toBe('ben');
    expect(getKnavesLiarId({}, storytellers, 1)).toBeUndefined();
    expect(getKnavesLiarId({ knavesLiarId: 'gone' }, storytellers, 1)).toBeUndefined();
  });

  it('judges info by who gave it', () => {
    const guess = { knavesLiarId: 'lachlan' };
    expect(getKnavesVerdict(guess, storytellers, 'lachlan', 1)).toBe('lie');
    expect(getKnavesVerdict(guess, storytellers, 'ben', 1)).toBe('true');
    expect(getKnavesVerdict(guess, storytellers, undefined, 1)).toBeUndefined();
    expect(getKnavesVerdict({}, storytellers, 'ben', 1)).toBeUndefined();
  });

  it('remembers the Storyteller the claimer got info from last', () => {
    const roleInfos = [
      entry(1, 'night', { '0': '0', [ROLE_INFO_STORYTELLER_KEY]: 'ben' }),
      entry(2, 'night', { '0': '2', [ROLE_INFO_STORYTELLER_KEY]: 'lachlan' }),
      entry(3, 'night', { '0': '1' }),
    ];
    expect(getLastStorytellerId(roleInfos, 'empath', 1, 'day')).toBe('ben');
    expect(getLastStorytellerId(roleInfos, 'empath', 3, 'night')).toBe('lachlan');
    expect(getLastStorytellerId(roleInfos, 'chef', 3, 'night')).toBeUndefined();
  });

  it('drops the Storyteller when they are taken out of the game', () => {
    const roleInfos = [entry(1, 'night', { '0': '0', [ROLE_INFO_STORYTELLER_KEY]: 'ben' })];
    expect(
      mapRoleInfoPlayerIds(roleInfos, (id) => (id === 'ben' ? undefined : id))?.[0].values,
    ).toEqual({ '0': '0' });
  });
});
