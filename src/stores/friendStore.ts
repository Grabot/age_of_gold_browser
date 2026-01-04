import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import { sendFriendRequest } from '$lib/api/friendApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { User } from '../types/user';
import type { Friend } from '../types/user';
import { accessTokenValue } from './authStore';
import { userStore } from './userStore';
import { avatarStore } from './avatarStore';

export const STORAGE_KEY_FRIENDS_PREFIX = 'friend_';

const initialState: FriendState = {
  friends: [],
  loading: false,
  error: null,
};

interface FriendState {
  friends: Friend[];
  loading: boolean;
  error: string | null;
}

function createFriendStore() {
  const { subscribe, update, set } = writable<FriendState>(initialState);

  // Load friends from localStorage on initialization
  if (typeof window !== 'undefined') {
    // TODO: Do we do this here or only after the login?
    loadFriendsFromStorage();
  }

  function loadFriendsFromStorage() {
    const keys = Object.keys(localStorage);
    const friendKeys = keys.filter(key => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));
    
    const friends: Friend[] = [];
    
    friendKeys.forEach(key => {
      const friendId = parseInt(key.replace(STORAGE_KEY_FRIENDS_PREFIX, ''));
      const friendData = localStorage.getItem(key);
      if (friendData) {
        try {
          const friend: Friend = JSON.parse(friendData);
          friends.push(friend);
        } catch (error) {
          console.error(`Failed to parse friend data for friend ${friendId}:`, error);
        }
      }
    });

    update(state => ({ ...state, friends }));
  }

  function saveFriendToStorage(friend: Friend) {
    console.log('Saving friend to storage', friend);
    if (typeof window !== 'undefined') {
      // Only store friend data without user object (user is stored separately)
      const friendToStore = {
        friend_id: friend.friend_id,
        accepted: friend.accepted,
        friend_version: friend.friend_version
      };
      localStorage.setItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friend.friend_id}`, JSON.stringify(friendToStore));
    }
  }

  function removeFriendFromStorage(friendId: number) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friendId}`);
    }
  }

  function getStoredFriend(friendId: number): Friend | null {
    const friendData = localStorage.getItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friendId}`);
    if (friendData) {
      try {
        return JSON.parse(friendData) as Friend;
      } catch (error) {
        console.error(`Failed to parse stored friend data for friend ${friendId}:`, error);
        return null;
      }
    }
    return null;
  }

  return {
    subscribe,
    setFriends: (friends: Friend[]) => {
      // Save each friend to storage
      friends.forEach(friend => saveFriendToStorage(friend));
      set({ friends, loading: false, error: null });
    },
    addFriend: () => {
      // TODO:
    },
    removeFriend: () => {
      // TODO:
    },
    acceptRequest: () => {
      // TODO:
    },
    rejectRequest: () => {
      // TODO:
    },
    sendFriendRequest: async (friendData: { friendId: number; username: string; avatar: string | undefined; }) => {
      try {
        const accessToken = get(accessTokenValue);
        const addFriendResponse: ApiResponse = await sendFriendRequest(accessToken, friendData.friendId);
        if (addFriendResponse.success) {
          // Create user object for the friend
          const user: User = {
            id: friendData.friendId,
            username: friendData.username,
            avatar_version: 0,
            profile_version: 0,
            avatar: friendData.avatar || undefined
          };

          // Store user in userStore
          userStore.updateUser(user);

          // Store avatar in avatarStore if available
          if (friendData.avatar) {
            avatarStore.updateAvatar(friendData.friendId, friendData.avatar);
          }

          // Create friend object
          const friend: Friend = {
            friend_id: friendData.friendId,
            accepted: false, // New friend requests start as not accepted
            friend_version: 0,
            user: user
          };

          // Save friend to storage
          saveFriendToStorage(friend);

          // Add friend to store
          update(state => ({
            ...state,
            friends: [...state.friends, friend]
          }));
        }
        return true;
      } catch (err) {
        errorToast(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    getUsersNeedingUpdate: (): number[] => {
      // TODO: not used remove?
      const store = { subscribe };
      const state = get(store) as FriendState;
      return state.friends
        .filter(friend => !userStore.getUser(friend.friend_id))
        .map(friend => friend.friend_id);
    },
    updateStoredFriend: (friend: Friend): void => {
      // TODO: not used remove?
      saveFriendToStorage(friend);
      update(state => {
        const newFriends = state.friends.filter(f => f.friend_id !== friend.friend_id);
        return { ...state, friends: [...newFriends, friend] };
      });
    },
    getStoredFriend,
    clear: () => {
      set(initialState);
      // Clear all friend storage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        const friendKeys = keys.filter(key => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));
        friendKeys.forEach(key => localStorage.removeItem(key));
      }
    },
  };
}

export const friendStore = createFriendStore();



