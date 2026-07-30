import { createIndexedDbStorage, type KeyValueDatabase } from '@/utils/web-storage';

function createMemoryDatabase(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues));
  const database: KeyValueDatabase = {
    get: async (key) => values.get(key) ?? null,
    set: async (key, value) => {
      values.set(key, value);
    },
    remove: async (key) => {
      values.delete(key);
    },
  };

  return { database, values };
}

function createLegacyStorage(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem: (key: string) => values.get(key) ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    values,
  };
}

describe('web storage', () => {
  it('round-trips large values through IndexedDB', async () => {
    const { database } = createMemoryDatabase();
    const storage = createIndexedDbStorage(async () => database);
    const imageBase64 = 'A'.repeat(18 * 1024 * 1024);
    const value = JSON.stringify({
      state: {
        scripts: [
          {
            id: 'synthetic-18mb-script',
            name: 'Synthetic 18 MB script',
            roles: [
              {
                id: 'synthetic-role',
                image: `data:image/png;base64,${imageBase64}`,
              },
            ],
          },
        ],
      },
      version: 5,
    });

    await storage.setItem('grim-keeper-game-store-v1', value);

    await expect(storage.getItem('grim-keeper-game-store-v1')).resolves.toBe(value);
  });

  it('prefers an existing IndexedDB value over legacy storage', async () => {
    const { database } = createMemoryDatabase({ store: 'indexed-db-state' });
    const legacyStorage = createLegacyStorage({ store: 'legacy-state' });
    const storage = createIndexedDbStorage(async () => database, legacyStorage);

    await expect(storage.getItem('store')).resolves.toBe('indexed-db-state');
    expect(legacyStorage.values.get('store')).toBe('legacy-state');
  });

  it('migrates legacy storage and removes it after a successful copy', async () => {
    const { database, values } = createMemoryDatabase();
    const legacyStorage = createLegacyStorage({ store: 'legacy-state' });
    const storage = createIndexedDbStorage(async () => database, legacyStorage);

    await expect(storage.getItem('store')).resolves.toBe('legacy-state');
    expect(values.get('store')).toBe('legacy-state');
    expect(legacyStorage.values.has('store')).toBe(false);
  });

  it('removes values from IndexedDB and legacy storage', async () => {
    const { database, values } = createMemoryDatabase({ store: 'state' });
    const legacyStorage = createLegacyStorage({ store: 'legacy-state' });
    const storage = createIndexedDbStorage(async () => database, legacyStorage);

    await storage.removeItem('store');

    expect(values.has('store')).toBe(false);
    expect(legacyStorage.values.has('store')).toBe(false);
  });

  it('reports a clear error when IndexedDB cannot save', async () => {
    const storage = createIndexedDbStorage(async () => {
      throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
    });

    await expect(storage.setItem('store', 'state')).rejects.toThrow(
      'Browser storage quota exceeded',
    );
  });

  it('keeps legacy storage when migration cannot be completed', async () => {
    const legacyStorage = createLegacyStorage({ store: 'legacy-state' });
    const storage = createIndexedDbStorage(async () => {
      throw new Error('blocked');
    }, legacyStorage);

    await expect(storage.getItem('store')).resolves.toBe('legacy-state');
    expect(legacyStorage.values.get('store')).toBe('legacy-state');
  });
});
