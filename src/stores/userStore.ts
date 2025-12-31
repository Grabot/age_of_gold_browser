import { writable, get } from 'svelte/store';
import type { User } from '../types/user';
import { getAvatarFromStore } from './avatarStore';

export const STORAGE_KEY_USERS_PREFIX = 'user_';

interface UserState {
  users: Map<number, User>;
}

const initialState: UserState = {
  users: new Map(),
};

function createUserStore() {
  const { subscribe, update, set } = writable<UserState>(initialState);

  // Load users from localStorage on initialization
  if (typeof window !== 'undefined') {
    loadUsersFromStorage();
  }

  function loadUsersFromStorage() {
    const keys = Object.keys(localStorage);
    const userKeys = keys.filter(key => key.startsWith(STORAGE_KEY_USERS_PREFIX));
    
    const users = new Map<number, User>();
    
    userKeys.forEach(key => {
      const userId = parseInt(key.replace(STORAGE_KEY_USERS_PREFIX, ''));
      const userData = localStorage.getItem(key);
      if (userData) {
        try {
          const user: User = JSON.parse(userData);
          users.set(userId, user);
        } catch (error) {
          console.error(`Failed to parse user data for user ${userId}:`, error);
        }
      }
    });

    update(state => ({ ...state, users }));
  }

  function saveUserToStorage(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_USERS_PREFIX}${user.id}`, JSON.stringify(user));
    }
  }

  function removeUserFromStorage(userId: number) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_USERS_PREFIX}${userId}`);
    }
  }

  function updateUser(user: User): void {
    update(state => {
      const newUsers = new Map(state.users);
      newUsers.set(user.id, user);
      saveUserToStorage(user);
      return { ...state, users: newUsers };
    });
  }

  function getUser(userId: number): User | null {
    const store = { subscribe };
    const state = get(store) as UserState;
    return state.users.get(userId) || null;
  }

  function getStoreState(): UserState {
    const store = { subscribe };
    const state = get(store) as UserState;
    return state;
  }

  async function getUserWithAvatar(userId: number): Promise<User | null> {
    let user = getUser(userId);
    
    if (!user) {
      // If user not in store, we could fetch from backend
      // For now, return null
      return null;
    }

    // If user doesn't have avatar, try to get it from avatar store
    if (!user.avatar) {
      const avatar = getAvatarFromStore(userId);
      if (avatar) {
        user = { ...user, avatar };
        updateUser(user);
      }
    }

    return user;
  }

  function removeUser(userId: number): void {
    update(state => {
      const newUsers = new Map(state.users);
      newUsers.delete(userId);
      removeUserFromStorage(userId);
      return { ...state, users: newUsers };
    });
  }

  function clearAllUsers(): void {
    update(state => ({ ...state, users: new Map() }));
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      const userKeys = keys.filter(key => key.startsWith(STORAGE_KEY_USERS_PREFIX));
      userKeys.forEach(key => localStorage.removeItem(key));
    }
  }

  function getAllUsers(): User[] {
    const store = { subscribe };
    const state = get(store) as UserState;
    return Array.from(state.users.values());
  }

  return {
    subscribe,
    updateUser,
    getUser,
    getUserWithAvatar,
    removeUser,
    clearAllUsers,
    getAllUsers,
  };
}

export const userStore = createUserStore();