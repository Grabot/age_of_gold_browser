import { writable, get } from 'svelte/store';
import { makeRequest } from '$lib/api/apiClient';
import { API } from '$lib/api/apiClient';
import { accessTokenValue } from './authStore';
import { getAvatar as getAvatarFromApi } from '$lib/api/userApi';

export const STORAGE_KEY_AVATAR_PREFIX = 'avatar_';

interface AvatarState {
  avatars: Map<number, string>;
}

const initialState: AvatarState = {
  avatars: new Map(),
};

function createAvatarStore() {
  const { subscribe, update, set } = writable<AvatarState>(initialState);

  // Load avatars from localStorage on initialization
  if (typeof window !== 'undefined') {
    loadAvatarsFromStorage();
  }

  function loadAvatarsFromStorage() {
    const keys = Object.keys(localStorage);
    const avatarKeys = keys.filter(key => key.startsWith(STORAGE_KEY_AVATAR_PREFIX));
    
    const avatars = new Map<number, string>();
    
    avatarKeys.forEach(key => {
      const userId = parseInt(key.replace(STORAGE_KEY_AVATAR_PREFIX, ''));
      const avatarData = localStorage.getItem(key);
      if (avatarData) {
        avatars.set(userId, avatarData);
      }
    });

    update(state => ({ ...state, avatars }));
  }

  function saveAvatarToStorage(userId: number, avatar: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_AVATAR_PREFIX}${userId}`, avatar);
    }
  }

  function removeAvatarFromStorage(userId: number) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_AVATAR_PREFIX}${userId}`);
    }
  }

  function updateAvatar(userId: number, avatar: string): void {
    update(state => {
      const newAvatars = new Map(state.avatars);
      newAvatars.set(userId, avatar);
      saveAvatarToStorage(userId, avatar);
      return { ...state, avatars: newAvatars };
    });
  }

  function getAvatar(userId: number): string | null {
    const store = { subscribe };
    const state = get(store) as AvatarState;
    return state.avatars.get(userId) || null;
  }

  // Export this function for use in userStore
  function getAvatarFromStore(userId: number): string | null {
    return getAvatar(userId);
  }

  async function fetchAvatar(userId: number): Promise<string | null> {
    try {
      const accessToken = get(accessTokenValue);
      if (!accessToken) {
        throw new Error('No access token available');
      }

      const response = await getAvatarFromApi(accessToken, userId);
      
      if (response.success && response.data) {
        // Convert Blob to base64 string
        const blob = response.data as Blob;
        const avatar = await blobToBase64(blob);
        updateAvatar(userId, avatar);
        return avatar;
      }
      
      return null;
    } catch (error) {
      console.error(`Failed to fetch avatar for user ${userId}:`, error);
      return null;
    }
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function getAvatarWithFetch(userId: number): Promise<string | null> {
    let avatar = getAvatar(userId);
    
    if (!avatar) {
      avatar = await fetchAvatar(userId);
      // Note: fetchAvatar already calls updateAvatar, so no need to update again here
    }
    
    return avatar;
  }

  function removeAvatar(userId: number): void {
    update(state => {
      const newAvatars = new Map(state.avatars);
      newAvatars.delete(userId);
      removeAvatarFromStorage(userId);
      return { ...state, avatars: newAvatars };
    });
  }

  function clearAllAvatars(): void {
    update(state => ({ ...state, avatars: new Map() }));
    
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      const avatarKeys = keys.filter(key => key.startsWith(STORAGE_KEY_AVATAR_PREFIX));
      avatarKeys.forEach(key => localStorage.removeItem(key));
    }
  }

  function getAllAvatars(): Map<number, string> {
    const store = { subscribe };
    const state = get(store) as AvatarState;
    return new Map(state.avatars);
  }

  return {
    subscribe,
    updateAvatar,
    getAvatar,
    getAvatarFromStore,
    fetchAvatar,
    getAvatarWithFetch,
    removeAvatar,
    clearAllAvatars,
    getAllAvatars,
  };
}

export const avatarStore = createAvatarStore();

// Export the helper function for external use
export const getAvatarFromStore = avatarStore.getAvatarFromStore;