import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import { sendFriendRequest } from '$lib/api/friendApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { User } from '../types/user';

interface Friend {
    user: User;
    accepted: boolean;
    requested: boolean;
}

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
  const { subscribe, set, update } = writable<FriendState>(initialState);

  return {
    subscribe,
    setFriends: (friends: Friend[]) => update((state) => ({ ...state, friends })),
    setFriendRequests: (requests: Friend[]) => update((state) => ({ ...state, friendRequests: requests })),
    addFriend: (friend: Friend) => update((state) => ({ ...state, groups: [...state.friends, friend] })),
    removeFriend: (id: number) => update((state) => ({
      ...state,
      friends: state.friends.filter((f) => f.user.id !== id),
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
    sendFriendRequest: async (accessToken: string, userId: number) => {
      try {
        const addFriendResponse: ApiResponse = await sendFriendRequest(accessToken, userId);
        // friendStore.addGroup({
        //   id: addFriendResponse.data.group_id,
        //   name: addFriendResponse.data.name,
        //   description: addFriendResponse.data.description,
        //   members: addFriendResponse.data.user_ids,
        //   private: addFriendResponse.data.private,
        //   mute: addFriendResponse.data.mute,
        //   unreadMessages: addFriendResponse.data.unread_messages,
        //   messageVersion: addFriendResponse.data.message_version,
        //   groupVersion: addFriendResponse.data.group_version,
        //   groupColour: addFriendResponse.data.group_colour,
        //   last_message_read_id: addFriendResponse.data.lastMessageReadId,
        // });
        return true;
      } catch (err) {
        errorToast(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
    createGroup: async (accessToken: string, name: string, memberIds: string[]) => {
      set({ ...get({ subscribe }), loading: true });
      try {
        // TODO: Implement API call to create a group
        // const newGroup = await createGroupAPI(accessToken, name, memberIds);
        // addGroup(newGroup);
        return true;
      } catch (err) {
        errorToast(err instanceof Error ? err.message : 'Unknown error');
        return false;
      }
    },
  };
}

export const friendStore = createFriendStore();


const STORAGE_KEY_FRIENDS = 'friends';
const STORAGE_KEY_GROUPS = 'groups';
const STORAGE_KEY_FRIEND_REQUESTS = 'friendRequests';

friendStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(state.friends));
    // localStorage.setItem(STORAGE_KEY_FRIEND_REQUESTS, JSON.stringify(state.friendRequests));
    // localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(state.groups));
  }
});

// const storedGroups = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_GROUPS) : '[]';
// const initialGroups = storedGroups ? JSON.parse(storedGroups) : [];
