import type { GameData } from '@/store/game-store';

const backupFormat = 'grim-keeper-backup';
const backupVersion = 1;

type Backup = {
  data: GameData;
  exportedAt: string;
  format: typeof backupFormat;
  version: typeof backupVersion;
};

export function createBackup(data: GameData) {
  const backup: Backup = {
    data,
    exportedAt: new Date().toISOString(),
    format: backupFormat,
    version: backupVersion,
  };

  return JSON.stringify(backup, null, 2);
}

export function parseBackup(value: string): GameData {
  const backup: unknown = JSON.parse(value);

  if (!isRecord(backup) || backup.format !== backupFormat || backup.version !== backupVersion) {
    throw new Error('This is not a supported Grim Keeper backup.');
  }

  if (!isGameData(backup.data)) {
    throw new Error('The backup is missing required Grim Keeper data.');
  }

  return backup.data;
}

function isGameData(value: unknown): value is GameData {
  return (
    isRecord(value) &&
    typeof value.appUserName === 'string' &&
    Array.isArray(value.friends) &&
    Array.isArray(value.games) &&
    Array.isArray(value.roleCatalog) &&
    Array.isArray(value.savedNotes) &&
    Array.isArray(value.scripts)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
