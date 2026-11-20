import type { Game, SavedNote } from '@/types/game';
import type { BackupGameData } from '@/utils/data-transfer';
import { getSyncBase, mergeSyncData } from '@/utils/sync-merge';

function createGame(id: string, updatedAt: string): Game {
  return {
    activeDay: 1,
    conversations: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    id,
    players: [],
    updatedAt,
  };
}

function createData(overrides: Partial<BackupGameData> = {}): BackupGameData {
  return {
    appUserName: 'You',
    defaultStartingNight: 1,
    friends: [],
    games: [],
    roleCatalog: [],
    savedNotes: [],
    scripts: [],
    ...overrides,
  };
}

const old = '2026-01-01T00:00:00.000Z';
const synced = '2026-02-01T00:00:00.000Z';
const recent = '2026-03-01T00:00:00.000Z';

describe('mergeSyncData', () => {
  it('keeps new games from both devices', () => {
    const merged = mergeSyncData({
      local: createData({ games: [createGame('a', old)] }),
      localChanged: true,
      remote: createData({ games: [createGame('b', old)] }),
    });

    expect(merged.games.map((game) => game.id).sort()).toEqual(['a', 'b']);
  });

  it('takes the newer copy of a game', () => {
    const merged = mergeSyncData({
      local: createData({ games: [{ ...createGame('a', old), activeDay: 1 }] }),
      localChanged: true,
      remote: createData({ games: [{ ...createGame('a', recent), activeDay: 4 }] }),
    });

    expect(merged.games[0]?.activeDay).toBe(4);
  });

  it('drops a game deleted on the other device', () => {
    const base = getSyncBase(createData({ games: [createGame('a', old)] }), synced);
    const merged = mergeSyncData({
      base,
      local: createData({ games: [createGame('a', old)] }),
      localChanged: false,
      remote: createData(),
    });

    expect(merged.games).toEqual([]);
  });

  it('keeps a game edited here after the other device deleted it', () => {
    const base = getSyncBase(createData({ games: [createGame('a', old)] }), synced);
    const merged = mergeSyncData({
      base,
      local: createData({ games: [createGame('a', recent)] }),
      localChanged: true,
      remote: createData(),
    });

    expect(merged.games).toHaveLength(1);
  });

  it('keeps a deletion made here instead of restoring the remote copy', () => {
    const base = getSyncBase(createData({ games: [createGame('a', old)] }), synced);
    const merged = mergeSyncData({
      base,
      local: createData(),
      localChanged: true,
      remote: createData({ games: [createGame('a', old)] }),
    });

    expect(merged.games).toEqual([]);
  });

  it('merges saved notes and prefers local settings only when changed here', () => {
    const note = { id: 'n', updatedAt: old } as SavedNote;
    const input = {
      local: createData({ appUserName: 'Local', savedNotes: [note] }),
      remote: createData({ appUserName: 'Remote' }),
    };

    expect(mergeSyncData({ ...input, localChanged: true }).appUserName).toBe('Local');
    expect(mergeSyncData({ ...input, localChanged: false }).appUserName).toBe('Remote');
    expect(mergeSyncData({ ...input, localChanged: false }).savedNotes).toHaveLength(1);
  });
});
