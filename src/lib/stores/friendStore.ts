import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import {
	sendFriendRequest,
	respondToFriendRequest,
	cancelFriendRequest,
	removeFriend
} from '$lib/api/friendApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { User } from '../types/user';
import type { Friend } from '../types/friend';
import { accessTokenValue } from './authStore';
import { userStore } from './userStore';
import { avatarStore } from './avatarStore';

export const STORAGE_KEY_FRIENDS_PREFIX = 'friend_';

const initialState: FriendState = {
	friends: [],
	loading: false,
	error: null
};

interface FriendState {
	friends: Friend[];
	loading: boolean;
	error: string | null;
}

function createFriendStore() {
	const { subscribe, update, set } = writable<FriendState>(initialState);

	if (typeof window !== 'undefined') {
		loadFriendsFromStorage();
	}

	function loadFriendsFromStorage() {
		const keys = Object.keys(localStorage);
		const friendKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));

		const friends: Friend[] = [];

		friendKeys.forEach((key) => {
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

		update((state) => ({ ...state, friends }));
	}

	function saveFriendToStorage(friend: Friend) {
		if (typeof window !== 'undefined') {
			// Only store friend data without user object (user is stored separately)
			const friendToStore = {
				friend_id: friend.friend_id,
				accepted: friend.accepted,
				friend_version: friend.friend_version
			};
			localStorage.setItem(
				`${STORAGE_KEY_FRIENDS_PREFIX}${friend.friend_id}`,
				JSON.stringify(friendToStore)
			);
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

	function removeFriendFromStorage(friendId: number) {
		if (typeof window !== 'undefined') {
			localStorage.removeItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friendId}`);
		}
	}

	return {
		subscribe,
		setFriends: (friends: Friend[]) => {
			// Save each friend to storage
			friends.forEach((friend) => saveFriendToStorage(friend));
			set({ friends, loading: false, error: null });
		},
		sendFriendRequest: async (friendData: {
			friendId: number;
			username: string;
			avatar: string | undefined;
		}) => {
			try {
				const accessToken = get(accessTokenValue);
				const addFriendResponse: ApiResponse = await sendFriendRequest(
					accessToken,
					friendData.friendId
				);
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
						accepted: null, // I sent this request
						friend_version: 1,
						user: user
					};

					// Save friend to storage
					saveFriendToStorage(friend);

					// Add friend to store
					update((state) => ({
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
		updateFriend: (friend: Friend): void => {
			saveFriendToStorage(friend);
			update((state) => {
				const newFriends = state.friends.filter((f) => f.friend_id !== friend.friend_id);
				return { ...state, friends: [...newFriends, friend] };
			});
		},
		updateFriendUsername: (userId: number, newUsername: string, profileVersion: number): void => {
			update((state) => {
				const updatedFriends = state.friends.map((friend) => {
					if (friend.friend_id === userId) {
						// Update the friend version and user info
						const updatedFriend = {
							...friend,
							friend_version: friend.friend_version + 1,
							user: friend.user
								? {
										...friend.user,
										username: newUsername,
										profile_version: profileVersion
									}
								: undefined
						};
						// Save the updated friend to storage
						saveFriendToStorage(updatedFriend);
						return updatedFriend;
					}

					return friend;
				});
				return { ...state, friends: updatedFriends };
			});
		},
		addFriendRequest: (friendData: {
			friend_id: number;
			username: string;
			avatar_version: number;
			profile_version: number;
		}): void => {
			update((state) => {
				// Check if friend already exists
				const existingFriend = state.friends.find((f) => f.friend_id === friendData.friend_id);
				if (existingFriend) {
					// Friend already exists, just update if needed
					return state;
				}

				// Create user object
				const user: User = {
					id: friendData.friend_id,
					username: friendData.username,
					avatar_version: friendData.avatar_version,
					profile_version: friendData.profile_version
				};

				// Create friend object
				const newFriend: Friend = {
					friend_id: friendData.friend_id,
					accepted: false,
					friend_version: 1,
					user: user
				};

				// Save to storage
				saveFriendToStorage(newFriend);

				// Add to friends list
				const updatedFriends = [...state.friends, newFriend];
				return { ...state, friends: updatedFriends };
			});
		},
		acceptFriendRequest: async (friendId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				if (!accessToken) {
					throw new Error('No access token available');
				}

				const response = await respondToFriendRequest(accessToken, friendId, true);
				if (response.success) {
					// Update the friend status locally
					update((state) => {
						const updatedFriends = state.friends.map((friend) => {
							if (friend.friend_id === friendId) {
								return {
									...friend,
									accepted: true,
									friend_version: friend.friend_version + 1
								};
							}
							return friend;
						});
						return { ...state, friends: updatedFriends };
					});
					return true;
				}
				return false;
			} catch (error) {
				errorToast(error instanceof Error ? error.message : 'Unknown error');
				return false;
			}
		},
		rejectFriendRequest: async (friendId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				if (!accessToken) {
					throw new Error('No access token available');
				}

				const response = await respondToFriendRequest(accessToken, friendId, false);
				if (response.success) {
					// Remove the friend from the list
					update((state) => {
						const updatedFriends = state.friends.filter((friend) => friend.friend_id !== friendId);
						return { ...state, friends: updatedFriends };
					});
					// Remove from storage
					removeFriendFromStorage(friendId);
					return true;
				}
				return false;
			} catch (error) {
				errorToast(error instanceof Error ? error.message : 'Unknown error');
				return false;
			}
		},
		cancelFriendRequest: async (friendId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				if (!accessToken) {
					throw new Error('No access token available');
				}

				const response = await cancelFriendRequest(accessToken, friendId);
				if (response.success) {
					// Remove the friend from the list
					update((state) => {
						const updatedFriends = state.friends.filter((friend) => friend.friend_id !== friendId);
						return { ...state, friends: updatedFriends };
					});
					// Remove from storage
					removeFriendFromStorage(friendId);
					return true;
				}
				return false;
			} catch (error) {
				errorToast(error instanceof Error ? error.message : 'Unknown error');
				return false;
			}
		},
		removeFriend: async (friendId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				if (!accessToken) {
					throw new Error('No access token available');
				}

				const response = await removeFriend(accessToken, friendId);
				if (response.success) {
					// Remove the friend from the list
					update((state) => {
						const updatedFriends = state.friends.filter((friend) => friend.friend_id !== friendId);
						return { ...state, friends: updatedFriends };
					});
					// Remove from storage
					removeFriendFromStorage(friendId);
					return true;
				}
				return false;
			} catch (error) {
				errorToast(error instanceof Error ? error.message : 'Unknown error');
				return false;
			}
		},
		removeFriendFromList: async (friendId: number): Promise<boolean> => {
			update((state) => {
				const updatedFriends = state.friends.filter((friend) => friend.friend_id !== friendId);
				return { ...state, friends: updatedFriends };
			});
			return true;
		},
		getStoredFriend,
		removeFriendFromStorage,
		clear: () => {
			set(initialState);
			// Clear all friend storage
			if (typeof window !== 'undefined') {
				const keys = Object.keys(localStorage);
				const friendKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));
				friendKeys.forEach((key) => localStorage.removeItem(key));
			}
		}
	};
}

export const friendStore = createFriendStore();
