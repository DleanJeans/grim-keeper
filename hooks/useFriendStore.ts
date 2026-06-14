import { create } from 'zustand';
import type { Friend } from '../types';
import { generateId } from '../utils/layout';
import {
  ensureReady,
  platformGetItem,
  platformSetItem,
} from '../utils/platformStorage';

const STORAGE_KEY = 'grim-keeper-friends';

function readFriends(): Friend[] {
  try {
    const raw = platformGetItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeFriends(friends: Friend[]) {
  platformSetItem(STORAGE_KEY, JSON.stringify(friends));
}

interface FriendStore {
  friends: Friend[];
  loadFriends: () => void;
  addFriend: (name: string, notes: string) => void;
  updateFriend: (id: string, name: string, notes: string) => void;
  deleteFriend: (id: string) => void;
  recordGamePlayed: (id: string) => void;
}

export const useFriendStore = create<FriendStore>((set, get) => ({
  friends: readFriends(),
  loadFriends: () => {
    ensureReady().then(() =>
      set({
        friends: readFriends(),
      }),
    );
  },
  addFriend: (name, notes) => {
    const friend: Friend = {
      id: generateId(),
      name,
      notes,
      createdAt: Date.now(),
      lastPlayed: null,
      gameCount: 0,
    };
    const friends = [
      ...get().friends,
      friend,
    ];
    writeFriends(friends);
    set({
      friends,
    });
  },
  updateFriend: (id, name, notes) => {
    const friends = get().friends.map(f =>
      f.id === id
        ? {
            ...f,
            name,
            notes,
          }
        : f,
    );
    writeFriends(friends);
    set({
      friends,
    });
  },
  deleteFriend: id => {
    const friends = get().friends.filter(f => f.id !== id);
    writeFriends(friends);
    set({
      friends,
    });
  },
  recordGamePlayed: id => {
    const friends = get().friends.map(f =>
      f.id === id
        ? {
            ...f,
            lastPlayed: Date.now(),
            gameCount: f.gameCount + 1,
          }
        : f,
    );
    writeFriends(friends);
    set({
      friends,
    });
  },
}));
