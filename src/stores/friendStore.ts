import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import { sendFriendRequest, fetchAllFriends } from '$lib/api/friendApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { User } from '../types/user';
import type { Friend } from '../types/user';
import { accessTokenValue } from './authStore';

interface FriendWithUser {
  friend: Friend;
  user: User | null;
}

const initialState: FriendState = {
  friends: [],
  loading: false,
  error: null,
};

interface FriendState {
  friends: FriendWithUser[];
  loading: boolean;
  error: string | null;
}

function createFriendStore() {
  const { subscribe, update, set } = writable<FriendState>(initialState);

  return {
    subscribe,
    setFriends: () => {
      // TODO:
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
    fetchFriends: async (accessToken: string) => {
      set({ ...initialState, loading: true });
      try {
        // TODO: Implement API calls for friends
      } catch (err) {
        set({ ...initialState, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    },
    sendFriendRequest: async (friendData: { friendId: number; username: string; avatar: string | undefined; }) => {
      try {
        const accessToken = get(accessTokenValue);
        const addFriendResponse: ApiResponse = await sendFriendRequest(accessToken, friendData.friendId);
        if (addFriendResponse.success) {
        }
        return true;
      } catch (err) {
        errorToast(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    clear: () => {
      set(initialState);
    },
  };
}

export const friendStore = createFriendStore();


const STORAGE_KEY_FRIENDS = 'friends';

friendStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    const friendDataOnly = state.friends.map(fw => fw.friend);
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friendDataOnly));
  }
});
