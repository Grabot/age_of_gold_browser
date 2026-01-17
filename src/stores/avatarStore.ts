import { writable, get } from 'svelte/store';

export const STORAGE_KEY_AVATAR_PREFIX = 'avatar_';
export const STORAGE_KEY_SHOULD_UPDATE_AVATAR_PREFIX = 'shouldUpdateAvatar_';
export const STORAGE_KEY_GROUP_AVATAR_PREFIX = 'avatar_group_';
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

	function saveAvatarToStorage(userId: number, avatar: string) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`${STORAGE_KEY_AVATAR_PREFIX}${userId}`, avatar);
		}
	}

	function saveGroupAvatarToStorage(groupId: number, avatar: string) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(`${STORAGE_KEY_GROUP_AVATAR_PREFIX}${groupId}`, avatar);
		}
	}

	function saveShouldUpdateAvatarToStorage(userId: number, shouldUpdate: boolean) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(
				`${STORAGE_KEY_SHOULD_UPDATE_AVATAR_PREFIX}${userId}`,
				shouldUpdate.toString()
			);
		}
	}

	function saveShouldUpdateGroupAvatarToStorage(groupId: number, shouldUpdate: boolean) {
		if (typeof window !== 'undefined') {
			localStorage.setItem(
				`${STORAGE_KEY_SHOULD_UPDATE_GROUP_AVATAR_PREFIX}${groupId}`,
				shouldUpdate.toString()
			);
		}
	}

	function updateAvatar(userId: number, avatar: string): void {
		update((state) => {
			saveAvatarToStorage(userId, avatar);

			// Clear the shouldUpdate flag when avatar is updated
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, false);
			saveShouldUpdateAvatarToStorage(userId, false);

			return {
				...state,
				shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser
			};
		});
	}

	function getAvatar(userId: number): string | null {
		return localStorage.getItem(`${STORAGE_KEY_AVATAR_PREFIX}${userId}`);
	}

	function setShouldUpdateAvatarForUser(userId: number, shouldUpdate: boolean): void {
		update((state) => {
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, shouldUpdate);
			saveShouldUpdateAvatarToStorage(userId, shouldUpdate);
			return { ...state, shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser };
		});
	}

	function getShouldUpdateAvatarForUser(userId: number): boolean {
		const store = { subscribe };
		const state = get(store) as AvatarState;
		return state.shouldUpdateAvatarForUser.get(userId) || false;
	}

	function updateAvatarVersion(userId: number): void {
		update((state) => {
			const newShouldUpdateAvatarForUser = new Map(state.shouldUpdateAvatarForUser);
			newShouldUpdateAvatarForUser.set(userId, true);
			saveShouldUpdateAvatarToStorage(userId, true);
			return { ...state, shouldUpdateAvatarForUser: newShouldUpdateAvatarForUser };
		});
	}

	function updateGroupAvatar(groupId: number, avatar: string): void {
		update((state) => {
			saveGroupAvatarToStorage(groupId, avatar);

			// Clear the shouldUpdate flag when avatar is updated
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, false);
			saveShouldUpdateGroupAvatarToStorage(groupId, false);

			return {
				...state,
				shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup
			};
		});
	}

	function getGroupAvatar(groupId: number): string | null {
		return localStorage.getItem(`${STORAGE_KEY_GROUP_AVATAR_PREFIX}${groupId}`);
	}

	function setShouldUpdateGroupAvatarForGroup(groupId: number, shouldUpdate: boolean): void {
		update((state) => {
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, shouldUpdate);
			saveShouldUpdateGroupAvatarToStorage(groupId, shouldUpdate);
			return { ...state, shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup };
		});
	}

	function getShouldUpdateGroupAvatarForGroup(groupId: number): boolean {
		const store = { subscribe };
		const state = get(store) as AvatarState;
		return state.shouldUpdateAvatarForGroup.get(groupId) || false;
	}

	function updateGroupAvatarVersion(groupId: number): void {
		update((state) => {
			const newShouldUpdateAvatarForGroup = new Map(state.shouldUpdateAvatarForGroup);
			newShouldUpdateAvatarForGroup.set(groupId, true);
			saveShouldUpdateGroupAvatarToStorage(groupId, true);
			return { ...state, shouldUpdateAvatarForGroup: newShouldUpdateAvatarForGroup };
		});
	}

	function clear(): void {
		update((state) => ({
			...state,
			avatars: new Map(),
			shouldUpdateAvatarForUser: new Map(),
			shouldUpdateAvatarForGroup: new Map()
		}));

		if (typeof window !== 'undefined') {
			const keys = Object.keys(localStorage);
			const avatarKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_AVATAR_PREFIX));
			avatarKeys.forEach((key) => localStorage.removeItem(key));

			const shouldUpdateKeys = keys.filter((key) =>
				key.startsWith(STORAGE_KEY_SHOULD_UPDATE_AVATAR_PREFIX)
			);
			shouldUpdateKeys.forEach((key) => localStorage.removeItem(key));

			const groupAvatarKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_GROUP_AVATAR_PREFIX));
			groupAvatarKeys.forEach((key) => localStorage.removeItem(key));

			const shouldUpdateGroupKeys = keys.filter((key) =>
				key.startsWith(STORAGE_KEY_SHOULD_UPDATE_GROUP_AVATAR_PREFIX)
			);
			shouldUpdateGroupKeys.forEach((key) => localStorage.removeItem(key));
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
		updateGroupAvatarVersion
	};
}

export const avatarStore = createAvatarStore();
