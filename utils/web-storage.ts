import type { StateStorage } from 'zustand/middleware';

const DATABASE_NAME = 'grim-keeper-web-storage-v1';
const DATABASE_VERSION = 1;
const STORE_NAME = 'key-value';

type LegacyStorage = Pick<Storage, 'getItem' | 'removeItem'>;

export type KeyValueDatabase = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
  remove: (key: string) => Promise<void>;
  close?: () => void;
};

type OpenDatabase = () => Promise<KeyValueDatabase>;

export const webStorage = createIndexedDbStorage();

export function createIndexedDbStorage(
  openDatabase: OpenDatabase = openIndexedDb,
  legacyStorage: LegacyStorage | undefined = getLegacyStorage(),
): StateStorage {
  return {
    getItem: async (name) => {
      try {
        const storedValue = await withDatabase(openDatabase, (database) => database.get(name));
        if (storedValue !== null) {
          return storedValue;
        }

        const legacyValue = readLegacyValue(legacyStorage, name);
        if (legacyValue === null) {
          return null;
        }

        try {
          await withDatabase(openDatabase, (database) => database.set(name, legacyValue));
          legacyStorage?.removeItem(name);
        } catch {
          // Keep the legacy value available if migration cannot be completed yet.
        }

        return legacyValue;
      } catch {
        return readLegacyValue(legacyStorage, name);
      }
    },
    setItem: async (name, value) => {
      try {
        await withDatabase(openDatabase, (database) => database.set(name, value));
      } catch (error) {
        throw toStorageError(error);
      }
    },
    removeItem: async (name) => {
      try {
        await withDatabase(openDatabase, (database) => database.remove(name));
        legacyStorage?.removeItem(name);
      } catch (error) {
        throw toStorageError(error);
      }
    },
  };
}

async function withDatabase<T>(
  openDatabase: OpenDatabase,
  operation: (database: KeyValueDatabase) => Promise<T>,
) {
  const database = await openDatabase();

  try {
    return await operation(database);
  } finally {
    database.close?.();
  }
}

function openIndexedDb(): Promise<KeyValueDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is unavailable.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onerror = () => reject(request.error ?? new Error('IndexedDB could not be opened.'));
    request.onblocked = () => reject(new Error('IndexedDB is blocked by another browser tab.'));
    request.onsuccess = () => resolve(createKeyValueDatabase(request.result));
  });
}

function createKeyValueDatabase(database: IDBDatabase): KeyValueDatabase {
  return {
    get: (key) =>
      requestToPromise<string | undefined>(
        database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key),
      ).then((value) => value ?? null),
    set: (key, value) =>
      requestToPromise(
        database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key),
      ).then(() => undefined),
    remove: (key) =>
      requestToPromise(
        database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(key),
      ).then(() => undefined),
    close: () => database.close(),
  };
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
    request.onsuccess = () => resolve(request.result);
  });
}

function getLegacyStorage(): LegacyStorage | undefined {
  try {
    return typeof globalThis.localStorage === 'undefined' ? undefined : globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function readLegacyValue(storage: LegacyStorage | undefined, name: string) {
  try {
    return storage?.getItem(name) ?? null;
  } catch {
    return null;
  }
}

function toStorageError(error: unknown) {
  const errorName =
    error && typeof error === 'object' && 'name' in error ? String(error.name) : undefined;

  if (errorName === 'QuotaExceededError') {
    return new Error(
      'Browser storage quota exceeded. Free storage for this site and try uploading the script again.',
    );
  }

  return new Error('IndexedDB is unavailable. This browser cannot persist large scripts locally.');
}
