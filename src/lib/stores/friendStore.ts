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
import { indexedDBHelper } from './indexedDBHelper';

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

	async function loadFriendsFromStorage() {
		// Try IndexedDB first
		let friends: Friend[] = [];
		try {
			friends = (await indexedDBHelper.getAllFriends()) as Friend[];
		} catch (error) {
			console.error('Error loading friends from IndexedDB:', error);
		}

		// If no friends in IndexedDB, try localStorage for migration
		if (friends.length === 0) {
			const keys = Object.keys(localStorage);
			const friendKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));

			friendKeys.forEach((key) => {
				const friendId = parseInt(key.replace(STORAGE_KEY_FRIENDS_PREFIX, ''));
				const friendData = localStorage.getItem(key);
				if (friendData) {
					try {
						const friend: Friend = JSON.parse(friendData);
						friends.push(friend);
						// Migrate to IndexedDB
						indexedDBHelper.saveFriend(friend);
					} catch (error) {
						console.error(`Failed to parse friend data for friend ${friendId}:`, error);
					}
				}
			});
		}

		update((state) => ({ ...state, friends }));
	}

	async function saveFriendToStorage(friend: Friend) {
		if (typeof window !== 'undefined') {
			// Only store friend data without user object (user is stored separately)
			const friendToStore = {
				friend_id: friend.friend_id,
				accepted: friend.accepted,
				friend_version: friend.friend_version
			};
			await indexedDBHelper.saveFriend(friendToStore);
		}
	}

	async function getStoredFriend(friendId: number): Promise<Friend | null> {
		// Try IndexedDB first
		const friend = (await indexedDBHelper.getFriend(friendId)) as Friend | null;
		if (friend) {
			return friend;
		}

		// Fallback to localStorage for migration purposes
		const friendData = localStorage.getItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friendId}`);
		if (friendData) {
			try {
				const parsedFriend = JSON.parse(friendData) as Friend;
				// Migrate to IndexedDB
				await indexedDBHelper.saveFriend(parsedFriend);
				return parsedFriend;
			} catch (error) {
				console.error(`Failed to parse stored friend data for friend ${friendId}:`, error);
				return null;
			}
		}
		return null;
	}

	async function removeFriendFromStorage(friendId: number) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeFriend(friendId);
			localStorage.removeItem(`${STORAGE_KEY_FRIENDS_PREFIX}${friendId}`);
		}
	}

	return {
		subscribe,
		setFriends: async (friends: Friend[]) => {
			// Save each friend to storage
			for (const friend of friends) {
				await saveFriendToStorage(friend);
			}
			set({ friends, loading: false, error: null });
		},
		sendFriendRequest: async (friendData: {
			friendId: number;
			username: string;
			colour: string;
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
						colour: friendData.colour,
						avatar: friendData.avatar || undefined
					};

					// Store user in userStore
					userStore.updateUser(user);

					// Store avatar in avatarStore if available
					if (friendData.avatar) {
						await avatarStore.updateAvatar(friendData.friendId, friendData.avatar);
					}

					// Create friend object
					const friend: Friend = {
						friend_id: friendData.friendId,
						accepted: null, // I sent this request
						friend_version: 1,
						chat_id: null, // not yet accepted
						user: user
					};

					// Save friend to storage
					await saveFriendToStorage(friend);

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
		updateFriend: async (friend: Friend): Promise<void> => {
			await saveFriendToStorage(friend);
			update((state) => {
				const newFriends = state.friends.filter((f) => f.friend_id !== friend.friend_id);
				return { ...state, friends: [...newFriends, friend] };
			});
		},
		updateFriendUsername: async (
			userId: number,
			newUsername: string,
			profileVersion: number
		): Promise<void> => {
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
		updateFriendColour: async (
			userId: number,
			newColour: string,
			profileVersion: number
		): Promise<void> => {
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
										colour: newColour,
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
		addFriendRequest: async (friendData: {
			friend_id: number;
			username: string;
			colour: string;
			avatar_version: number;
			profile_version: number;
		}): Promise<void> => {
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
					colour: friendData.colour,
					avatar_version: friendData.avatar_version,
					profile_version: friendData.profile_version
				};

			// Create friend object
			const newFriend: Friend = {
				friend_id: friendData.friend_id,
				accepted: false,
				friend_version: 1,
				chat_id: null,
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
					await removeFriendFromStorage(friendId);
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
					await removeFriendFromStorage(friendId);
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
					await removeFriendFromStorage(friendId);
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
		getFriendByChatId: async (chatId: number): Promise<Friend | null> => {
			// First check memory store
			const state = get({ subscribe });
			let friend = state.friends.find((f) => f.chat_id === chatId);
			
			if (friend) {
				return friend;
			}
			
			// Try to get from IndexedDB
			const allFriends = await indexedDBHelper.getAllFriends() as Friend[];
			friend = allFriends.find((f) => f.chat_id === chatId);
			
			if (friend) {
				// Add to memory store if found
				update((state) => {
					const exists = state.friends.find((f) => f.friend_id === friend!.friend_id);
					if (!exists) {
						return { ...state, friends: [...state.friends, friend!] };
					}
					return state;
				});
				return friend;
			}
			
			return null;
		},
		getStoredFriend,
		removeFriendFromStorage,
		clear: async () => {
			set(initialState);
			// Clear all friend storage
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearFriends();

				// Clear localStorage as fallback
				const keys = Object.keys(localStorage);
				const friendKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_FRIENDS_PREFIX));
				friendKeys.forEach((key) => localStorage.removeItem(key));
			}
		}
	};
}

export const friendStore = createFriendStore();
