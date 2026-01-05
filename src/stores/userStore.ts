import { writable, get } from 'svelte/store';
import type { User } from '../types/user';

export const STORAGE_KEY_USERS_PREFIX = 'user_';

interface UserState {
}

const initialState: UserState = {
};

function createUserStore() {
  const { subscribe, update, set } = writable<UserState>(initialState);

  function saveUserToStorage(user: User) {
    const userToSave = {
      id: user.id,
      username: user.username,
      avatar_version: user.avatar_version,
      profile_version: user.profile_version
    };
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_USERS_PREFIX}${user.id}`, JSON.stringify(userToSave));
    }
  }

  function updateUser(user: User): void {
    saveUserToStorage(user);
  }

  function getUser(userId: number): User | null {
    const userData = localStorage.getItem(`${STORAGE_KEY_USERS_PREFIX}${userId}`);
    if (userData) {
      const user: User = JSON.parse(userData);
      return user;
    } else {
      return null;
    }
  }

  function clear(): void {
    update(state => ({ ...state, users: new Map() }));
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith(STORAGE_KEY_USERS_PREFIX));
      userKeys.forEach(key => localStorage.removeItem(key));
    }
  }

  return {
    subscribe,
    updateUser,
    getUser,
    clear,
  };
}

export const userStore = createUserStore();