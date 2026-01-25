import { writable } from 'svelte/store';
import { indexedDBHelper, SHOULD_UPDATE_USER_AVATAR_STORE, SHOULD_UPDATE_GROUP_AVATAR_STORE } from './indexedDBHelper';

export const STORAGE_KEY_SHOULD_UPDATE_AVATAR_PREFIX = 'shouldUpdateAvatar_';
export const STORAGE_KEY_SHOULD_UPDATE_GROUP_AVATAR_PREFIX = 'shouldUpdateGroupAvatar_';

export interface AvatarState {
	shouldUpdateAvatarForUser: Map<number, boolean>;
	shouldUpdateAvatarForGroup: Map<number, boolean>;
}

const initialState: AvatarState = {
	shouldUpdateAvatarForUser: new Map(),
	shouldUpdateAvatarForGroup: new Map()
};

function createAvatarStore() {
	const { subscribe, update, set } = writable<AvatarState>(initialState);

	// Load initial state from IndexedDB
	if (typeof window !== 'undefined') {
		loadShouldUpdateFlagsFromStorage();
	}

	async function loadShouldUpdateFlagsFromStorage() {
		try {
			// Load user avatar update flags from IndexedDB
			const userShouldUpdateFlags = await indexedDBHelper.getAll(SHOULD_UPDATE_USER_AVATAR_STORE);
			const shouldUpdateAvatarForUser = new Map<number, boolean>();
			userShouldUpdateFlags.forEach((flag: any) => {
				shouldUpdateAvatarForUser.set(flag.userId, flag.shouldUpdate);
			});

			// Load group avatar update flags from IndexedDB
			const groupShouldUpdateFlags = await indexedDBHelper.getAll(SHOULD_UPDATE_GROUP_AVATAR_STORE);
			const shouldUpdateAvatarForGroup = new Map<number, boolean>();
			groupShouldUpdateFlags.forEach((flag: any) => {
				shouldUpdateAvatarForGroup.set(flag.groupId, flag.shouldUpdate);
			});

			update((state) => ({
				...state,
				shouldUpdateAvatarForUser,
				shouldUpdateAvatarForGroup
			}));
		} catch (error) {
			console.error('Error loading shouldUpdate flags from IndexedDB:', error);
		}
	}

	async function saveAvatarToStorage(userId: number, avatar: string): Promise<void> {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveUserAvatar(userId, avatar);
		}
	}

	async function saveGroupAvatarToStorage(groupId: number, avatar: string): Promise<void> {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveGroupAvatar(groupId, avatar);
		}
	}

	async function saveShouldUpdateAvatarToStorage(userId: number, shouldUpdate: boolean) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveShouldUpdateUserAvatar(userId, shouldUpdate);
		}
	}

	async function saveShouldUpdateGroupAvatarToStorage(groupId: number, shouldUpdate: boolean) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveShouldUpdateGroupAvatar(groupId, shouldUpdate);
		}
	}

	async function updateAvatar(userId: number, avatar: string): Promise<void> {
		update((state) => {
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, false);
			saveShouldUpdateAvatarToStorage(userId, false);

			return {
				...state,
				shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser
			};
		});

		// Save avatar to IndexedDB
		await saveAvatarToStorage(userId, avatar);
	}

	async function removeAvatarFromStorage(userId: number): Promise<void> {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeUserAvatar(userId);
			await indexedDBHelper.removeShouldUpdateUserAvatar(userId);
		}
	}

	async function removeGroupAvatarFromStorage(groupId: number): Promise<void> {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeGroupAvatar(groupId);
			await indexedDBHelper.removeShouldUpdateGroupAvatar(groupId);
		}
	}

	async function getAvatar(userId: number): Promise<string | null> {
		if (typeof window !== 'undefined') {
			const avatar = (await indexedDBHelper.getUserAvatar(userId)) as { userId: number; avatar: string } | null;
			if (avatar && avatar.avatar) {
				return avatar.avatar;
			}
		}
		return null;
	}

	async function setShouldUpdateAvatarForUser(
		userId: number,
		shouldUpdate: boolean
	): Promise<void> {
		update((state) => {
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, shouldUpdate);
			return { ...state, shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser };
		});

		await indexedDBHelper.saveShouldUpdateUserAvatar(userId, shouldUpdate);
	}

	async function getShouldUpdateAvatarForUser(userId: number): Promise<boolean> {
		if (typeof window !== 'undefined') {
			return await indexedDBHelper.getShouldUpdateUserAvatar(userId);
		}
		return false;
	}

	async function updateAvatarVersion(userId: number): Promise<void> {
		update((state) => {
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, true);
			return { ...state, shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser };
		});

		await indexedDBHelper.saveShouldUpdateUserAvatar(userId, true);
	}

	async function updateGroupAvatar(groupId: number, avatar: string): Promise<void> {
		update((state) => {
			// Clear the shouldUpdate flag when avatar is updated
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, false);
			return {
				...state,
				shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup
			};
		});

		// Save group avatar to IndexedDB
		await saveGroupAvatarToStorage(groupId, avatar);
	}

	async function getGroupAvatar(groupId: number): Promise<string | null> {
		if (typeof window !== 'undefined') {
			const avatar = (await indexedDBHelper.getGroupAvatar(groupId)) as { groupId: number; avatar: string } | null;
			if (avatar && avatar.avatar) {
				return avatar.avatar;
			}
		}
		return null;
	}

	async function setShouldUpdateGroupAvatarForGroup(
		groupId: number,
		shouldUpdate: boolean
	): Promise<void> {
		update((state) => {
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, shouldUpdate);
			return { ...state, shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup };
		});

		await indexedDBHelper.saveShouldUpdateGroupAvatar(groupId, shouldUpdate);
	}

	async function getShouldUpdateGroupAvatarForGroup(groupId: number): Promise<boolean> {
		if (typeof window !== 'undefined') {
			return await indexedDBHelper.getShouldUpdateGroupAvatar(groupId);
		}
		return false;
	}

	async function updateGroupAvatarVersion(groupId: number): Promise<void> {
		update((state) => {
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, true);
			return { ...state, shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup };
		});

		await indexedDBHelper.saveShouldUpdateGroupAvatar(groupId, true);
	}

	async function clear(): Promise<void> {
		update((state) => ({
			...state,
			shouldUpdateAvatarForUser: new Map(),
			shouldUpdateAvatarForGroup: new Map()
		}));

		if (typeof window !== 'undefined') {
			await indexedDBHelper.clearUserAvatars();
			await indexedDBHelper.clearGroupAvatars();
			await indexedDBHelper.clearShouldUpdateUserAvatars();
			await indexedDBHelper.clearShouldUpdateGroupAvatars();
		}
	}

	return {
		subscribe,
		updateAvatar,
		getAvatar,
		clear,
		setShouldUpdateAvatarForUser,
		getShouldUpdateAvatarForUser,
		updateAvatarVersion,
		updateGroupAvatar,
		getGroupAvatar,
		setShouldUpdateGroupAvatarForGroup,
		getShouldUpdateGroupAvatarForGroup,
		updateGroupAvatarVersion,
		removeAvatarFromStorage,
		removeGroupAvatarFromStorage
	};
}

export const avatarStore = createAvatarStore();