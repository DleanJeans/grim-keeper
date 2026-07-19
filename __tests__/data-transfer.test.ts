import type { GameData } from '@/store/game-store';
import { createBackup, parseBackup } from '@/utils/data-transfer';

const data: GameData = {
  appUserName: 'Keeper',
  friends: [],
  games: [],
  roleCatalog: [],
  savedNotes: [],
  scripts: [],
};

describe('data transfer', () => {
  it('round trips all persisted data', () => {
    expect(parseBackup(createBackup(data))).toEqual(data);
  });

  it('rejects unrelated JSON', () => {
    expect(() => parseBackup('{"games":[]}')).toThrow(
      'This is not a supported Grim Keeper backup.',
    );
  });

  it('rejects a backup missing required data', () => {
    expect(() => parseBackup('{"format":"grim-keeper-backup","version":1,"data":{}}')).toThrow(
      'The backup is missing required Grim Keeper data.',
    );
  });
});
