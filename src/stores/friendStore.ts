import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import { sendFriendRequest, fetchAllFriends } from '$lib/api/friendApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { User } from '../types/user';
import type { Friend } from '../types/user';
import { accessTokenValue } from './authStore';
import { userStore } from './userStore';
import { avatarStore } from './avatarStore';

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
    setFriends: (friends: Friend[]) => {
      const friendsWithUsers: FriendWithUser[] = friends.map(friend => {
        let user = userStore.getUser(friend.friend_id);
        
        // Create placeholder user if not found
        if (!user) {
          user = {
            id: friend.friend_id,
            username: `User_${friend.friend_id}`,
            profile_version: 1,
            avatar_version: 1
          };
          userStore.updateUser(user);
        }
        
        return { friend, user };
      });
      update((state) => ({ ...state, friends: friendsWithUsers }));
    },
    addFriend: (friend: Friend) => {
      const user = userStore.getUser(friend.friend_id);
      update((state) => ({ ...state, friends: [...state.friends, { friend, user }] }));
    },
    removeFriend: (friendId: number) => update((state) => ({
      ...state,
      friends: state.friends.filter((f) => f.friend.friend_id !== friendId),
    })),
    acceptRequest: () => {

    },
    rejectRequest: () => {

    },
    fetchFriends: async (accessToken: string) => {
      set({ ...initialState, loading: true });
      try {
        // TODO: Implement API calls for friends and groups
        // const [friends, requests, groups] = await Promise.all([
        //   fetchFriendsAPI(accessToken),
        //   fetchFriendRequestsAPI(accessToken),
        //   fetchGroupsAPI(accessToken),
        // ]);
        // set({ friends, friendRequests, groups, loading: false, error: null });
      } catch (err) {
        set({ ...initialState, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    },
    sendFriendRequest: async (friendData: { friendId: number; username: string; avatar: string | undefined; }) => {
      try {
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
const STORAGE_KEY_GROUPS = 'groups';
const STORAGE_KEY_FRIEND_REQUESTS = 'friendRequests';

friendStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    const friendDataOnly = state.friends.map(fw => fw.friend);
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friendDataOnly));
  }
});
