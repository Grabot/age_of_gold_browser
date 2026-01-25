import { writable } from 'svelte/store';
import type { User } from '../types/user';
import { indexedDBHelper } from './indexedDBHelper';

export const STORAGE_KEY_USERS_PREFIX = 'user_';

interface UserState {}

const initialState: UserState = {};

function createUserStore() {
	const { subscribe, update } = writable<UserState>(initialState);

	async function saveUserToStorage(user: User) {
		const userToSave = {
			id: user.id,
			username: user.username,
			avatar_version: user.avatar_version,
			profile_version: user.profile_version
		};
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveUser(userToSave);
		}
	}

	async function removeUserFromStorage(userId: number) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeUser(userId);
		}
	}

	async function updateUser(user: User): Promise<void> {
		await saveUserToStorage(user);
	}

	async function getUser(userId: number): Promise<User | null> {
		if (typeof window !== 'undefined') {
			const user = (await indexedDBHelper.getUser(userId)) as User | null;
			if (user) {
				return user;
			}

			// Fallback to localStorage for migration purposes
			const userData = localStorage.getItem(`${STORAGE_KEY_USERS_PREFIX}${userId}`);
			if (userData) {
				try {
					const parsedUser: User = JSON.parse(userData);
					// Migrate to IndexedDB
					await indexedDBHelper.saveUser(parsedUser);
					return parsedUser;
				} catch (error) {
					console.error(`Failed to parse user data for user ${userId}:`, error);
				}
			}
		}
		return null;
	}

	async function clear(): Promise<void> {
		update((state) => ({ ...state, users: new Map() }));

		if (typeof window !== 'undefined') {
			// Clear IndexedDB
			await indexedDBHelper.clearUsers();

			// Clear localStorage as fallback
			const keys = Object.keys(localStorage);
			const userKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_USERS_PREFIX));
			userKeys.forEach((key) => localStorage.removeItem(key));
		}
	}

	return {
		subscribe,
		updateUser,
		getUser,
		clear,
		removeUserFromStorage
	};
}

export const userStore = createUserStore();
