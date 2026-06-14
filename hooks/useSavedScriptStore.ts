import { create } from 'zustand';
import type { SavedScript } from '../types';
import { generateId } from '../utils/layout';
import { platformGetItem, platformSetItem } from '../utils/platformStorage';

const STORAGE_KEY = 'grim-keeper-saved-scripts';

function loadScripts(): SavedScript[] {
  try {
    const raw = platformGetItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveScripts(scripts: SavedScript[]) {
  try {
    platformSetItem(STORAGE_KEY, JSON.stringify(scripts));
  } catch {}
}

interface SavedScriptStore {
  scripts: SavedScript[];
  loadScripts: () => void;
  saveScript: (
    name: string,
    author: string,
    version: string,
    roleIds: string[],
  ) => string;
  deleteScript: (id: string) => void;
  getScriptNames: () => {
    id: string;
    name: string;
  }[];
}

export const useSavedScriptStore = create<SavedScriptStore>((set, get) => ({
  scripts: [],
  loadScripts: () =>
    set({
      scripts: loadScripts(),
    }),
  saveScript: (name, author, version, roleIds) => {
    const script: SavedScript = {
      id: generateId(),
      name,
      author,
      version,
      roleIds,
      savedAt: Date.now(),
    };
    const scripts = [...get().scripts, script];
    saveScripts(scripts);
    set({
      scripts,
    });
    return script.id;
  },
  deleteScript: id => {
    const scripts = get().scripts.filter(s => s.id !== id);
    saveScripts(scripts);
    set({
      scripts,
    });
  },
  getScriptNames: () =>
    get().scripts.map(s => ({
      id: s.id,
      name: s.name,
    })),
}));
