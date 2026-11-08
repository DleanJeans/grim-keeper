import type { Player, Role } from '@/types/game';
import { APP_USER_ID } from '@/utils/app-user';
import {
  getRandomPlayerCandidates,
  getRandomRoleCandidates,
  isStartKnowingRole,
} from '@/utils/random-pick-utils';

const ROLES: Role[] = [
  {
    ability: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
    id: 'washerwoman',
    name: 'Washerwoman',
    team: 'townsfolk',
  },
  { ability: 'Each night, choose a player.', id: 'monk', name: 'Monk', team: 'townsfolk' },
  { ability: 'You might register as evil.', id: 'recluse', name: 'Recluse', team: 'outsider' },
  { id: 'poisoner', name: 'Poisoner', team: 'minion' },
  { id: 'spy', name: 'Spy', team: 'minion' },
  { id: 'imp', name: 'Imp', team: 'demon' },
  { id: 'thief', name: 'Thief', team: 'traveller' },
];

const ids = (roles: Role[]) => roles.map((role) => role.id);

describe('random picks', () => {
  it('finds "You start knowing" characters', () => {
    expect(isStartKnowingRole(ROLES[0])).toBe(true);
    expect(isStartKnowingRole(ROLES[1])).toBe(false);
  });

  it('filters characters by team and leaves out Travellers', () => {
    const all = { inPlayOnly: false, noStartKnowing: false, teams: [] };
    expect(ids(getRandomRoleCandidates(ROLES, all, new Set(), new Map()))).not.toContain('thief');
    expect(
      ids(getRandomRoleCandidates(ROLES, { ...all, teams: ['minion'] }, new Set(), new Map())),
    ).toEqual(['poisoner', 'spy']);
    expect(
      ids(getRandomRoleCandidates(ROLES, { ...all, noStartKnowing: true }, new Set(), new Map())),
    ).toEqual(['monk', 'recluse', 'poisoner', 'spy', 'imp']);
  });

  it('keeps In play only to non-bluffs and the In play evil picks', () => {
    const filters = { inPlayOnly: true, noStartKnowing: false, teams: [] };
    expect(
      ids(
        getRandomRoleCandidates(
          ROLES,
          filters,
          new Set(['monk']),
          new Map([['minion', new Set(['spy'])]]),
        ),
      ),
    ).toEqual(['washerwoman', 'recluse', 'spy', 'imp']);
  });

  it('picks alive players other than you and the Storyteller', () => {
    const players: Player[] = [
      { id: APP_USER_ID, name: 'You', seat: 0 },
      { id: 'a', name: 'A', seat: 1 },
      { death: { day: 1, kind: 'night', updatedAt: '' }, id: 'b', name: 'B', seat: 2 },
      { id: 'st', isStoryteller: true, name: 'ST', seat: 3 },
    ];
    expect(getRandomPlayerCandidates(players, false, 2, 'day').map((p) => p.id)).toEqual([
      'a',
      'b',
    ]);
    expect(getRandomPlayerCandidates(players, true, 2, 'day').map((p) => p.id)).toEqual(['a']);
  });
});
