import { get, writable } from 'svelte/store';
import type { User } from '../types/user';
import type { Friend } from '../types/user';
import {
	loginTokenGoogle,
	loginUser,
	logoutUser,
	registerUser,
	validateToken
} from '$lib/api/authApi';
import { getUser, getMultipleUsers } from '$lib/api/userApi';
import { type LoginResponse, type FriendLogin } from '$lib/api/apiClient';
import { friendStore } from './friendStore';
import { userStore } from './userStore';
import { avatarStore } from './avatarStore';
import { errorToast } from '../utils/toast';

export const STORAGE_KEY_ACCESS_TOKEN = 'accessToken';
export const STORAGE_KEY_REFRESH_TOKEN = 'refreshToken';
export const STORAGE_KEY_PROFILE_VERSION = 'profileVersion';
export const STORAGE_KEY_AVATAR_VERSION = 'avatarVersion';
export const STORAGE_KEY_SHOULD_UPDATE_AVATAR = 'shouldUpdateAvatarFlag';
export const STORAGE_KEY_LAST_VALIDATION_TIME = 'lastValidationTimeFlag';
export const STORAGE_KEY_USER_DETAIL = 'userDetail';
export const STORAGE_KEY_USER_AVATAR = 'userAvatar';

const storedValueAccessToken =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN) : '';
const initialValueAccessToken = storedValueAccessToken ? storedValueAccessToken : '';
export const accessTokenValue = writable(initialValueAccessToken);

const storedValueRefreshToken =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN) : '';
const initialValueRefreshToken = storedValueRefreshToken ? storedValueRefreshToken : '';
export const refreshTokenValue = writable(initialValueRefreshToken);

const storedValueProfileVersion =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PROFILE_VERSION) : 0;
const initialValueProfileVersion = storedValueProfileVersion
	? Number(storedValueProfileVersion)
	: 0;
export const profileVersionValue = writable(initialValueProfileVersion);

const storedValueAvatarVersion =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_AVATAR_VERSION) : 0;
const initialValueAvatarVersion = storedValueAvatarVersion ? Number(storedValueAvatarVersion) : 0;
export const avatarVersionValue = writable(initialValueAvatarVersion);

const storedValueShouldUpdateAvatar =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SHOULD_UPDATE_AVATAR) : 'true';
const initialValueShouldUpdateAvatar = storedValueShouldUpdateAvatar
	? JSON.parse(storedValueShouldUpdateAvatar)
	: true;
export const shouldUpdateAvatar = writable(initialValueShouldUpdateAvatar);

const storedValueLastValidationTime =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_VALIDATION_TIME) : null;
const initialValueLastValidationTime = storedValueLastValidationTime
	? Number(storedValueLastValidationTime)
	: 0;
export const lastValidationTime = writable(initialValueLastValidationTime);

const storedValueUserDetail =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_DETAIL) : '{}';
const initialValueUserDetail = storedValueUserDetail ? JSON.parse(storedValueUserDetail) : {};
export const userDetail = writable(initialValueUserDetail);

const storedValueUserAvatar =
	typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_AVATAR) : '';
const initialValueUserAvatar = storedValueUserAvatar ? storedValueUserAvatar : '';
export const userAvatar = writable(initialValueUserAvatar);

accessTokenValue.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, value);
	}
});

refreshTokenValue.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, value);
	}
});

profileVersionValue.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_PROFILE_VERSION, value.toString());
	}
});

avatarVersionValue.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_AVATAR_VERSION, value.toString());
	}
});

lastValidationTime.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_LAST_VALIDATION_TIME, value.toString());
	}
});

shouldUpdateAvatar.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_SHOULD_UPDATE_AVATAR, JSON.stringify(value));
	}
});

userDetail.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_USER_DETAIL, JSON.stringify(value));
	}
});

userAvatar.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_USER_AVATAR, value);
	}
});

interface AuthState {
	isAuthenticated: boolean;
	accessToken: string | null;
	refreshToken: string | null;
	profileVersion: number | null;
	avatarVersion: number | null;
	user: User | null;
	loading: boolean;
}

const initialState: AuthState = {
	isAuthenticated: false,
	accessToken: null,
	refreshToken: null,
	profileVersion: null,
	avatarVersion: null,
	user: null,
	loading: true
};

async function retrieveMissingUsers(userIds: number[], accessToken: string): Promise<void> {
	if (userIds.length === 0) {
		return;
	}

	try {
		const usersResponse = await getMultipleUsers(accessToken, userIds);

		if (usersResponse.data) {
			for (const userResponse of usersResponse.data) {
				const storedUser = userStore.getUser(userResponse.id);
				const user: User = {
					id: userResponse.id,
					username: userResponse.username,
					avatar_version: userResponse.avatar_version || 0, // TODO: versions have to be present.
					profile_version: userResponse.profile_version || 0,
					avatar: undefined
				};
				if (storedUser) {
					if (storedUser.avatar_version !== userResponse.avatar_version) {
						avatarStore.setShouldUpdateAvatarForUser(userResponse.id, true);
						// Only update avatar_version when we actually retrieve and update the avatar.
						user.avatar_version = storedUser.avatar_version;
					}
				} else {
					avatarStore.setShouldUpdateAvatarForUser(userResponse.id, true);
				}
				userStore.updateUser(user);
				const storedFriend = friendStore.getStoredFriend(user.id);
				if (storedFriend) {
					storedFriend.user = user;
					friendStore.updateFriend(storedFriend);
				}
			}
		}
	} catch (error) {
		console.error('Failed to retrieve missing users:', error);
	}
}

async function retrieveMissingFriends(friendIds: number[], accessToken: string): Promise<void> {
	if (friendIds.length === 0) {
		return;
	}

	const friends: Friend[] = [];
	try {
		const { fetchFriends } = await import('$lib/api/friendApi');
		const friendsResponse = await fetchFriends(accessToken, friendIds);

		if (friendsResponse.success && friendsResponse.data) {
			// Update each friend's data
			for (const friendData of friendsResponse.data) {
				const storedUser = userStore.getUser(friendData.friend_id);

				const friend: Friend = {
					friend_id: friendData.friend_id,
					accepted: friendData.accepted,
					friend_version: friendData.friend_version,
					user: storedUser || undefined
				};

				friendStore.updateFriend(friend);
			}
		}
	} catch (error) {
		console.error('Failed to retrieve missing friends data:', error);
	}

	return;
}

function createAuthStore() {
	const { subscribe, set } = writable<AuthState>(initialState);

	async function handleLoginResponse(loginResult: LoginResponse) {
		accessTokenValue.set(loginResult.access_token);
		refreshTokenValue.set(loginResult.refresh_token);

		let loginResultUser;
		console.log('logged in');
		console.log(loginResult);
		if (get(profileVersionValue) != loginResult.profile_version) {
			console.log('update user detailse');
			const newUserDetail = await getUser(loginResult.access_token);
			console.log(newUserDetail.user);
			loginResultUser = newUserDetail.user;
			userDetail.set(loginResultUser);
		} else {
			loginResultUser = get(userDetail);
		}

		if (get(avatarVersionValue) != loginResult.avatar_version) {
			shouldUpdateAvatar.set(true);
		}

		profileVersionValue.set(loginResult.profile_version);
		avatarVersionValue.set(loginResult.avatar_version);

		// Track user IDs and friend IDs that need retrieval
		const userIdsToRetrieve: number[] = [];
		const friendIdsToRetrieve: number[] = [];

		// Convert FriendLogin to Friend format using stored data
		const friends: Friend[] = [];

		loginResult.friends.forEach((friendLogin) => {
			const storedUser = userStore.getUser(friendLogin.friend_id);
			const storedFriend = friendStore.getStoredFriend(friendLogin.friend_id);

			// Check if we have stored user data or need to retrieve it
			let user: User | undefined;
			if (storedUser) {
				user = {
					...storedUser
				};
			} else {
				// Mark user for retrieval
				userIdsToRetrieve.push(friendLogin.friend_id);
			}

			// Only create friend entry if we have stored data with matching version
			if (storedFriend && storedFriend.friend_version === friendLogin.friend_version) {
				friends.push({
					friend_id: friendLogin.friend_id,
					accepted: storedFriend.accepted,
					friend_version: storedFriend.friend_version,
					user: user
				});
			} else {
				// Mark friend and user for retrieval and add to friends list later
				friendIdsToRetrieve.push(friendLogin.friend_id);
				userIdsToRetrieve.push(friendLogin.friend_id);
			}
		});

		// Update friend store with the converted friends
		friendStore.setFriends(friends);

		// Retrieve missing friend data
		if (friendIdsToRetrieve.length > 0) {
			await retrieveMissingFriends(friendIdsToRetrieve, loginResult.access_token);
		}
		// Retrieve missing user data
		if (userIdsToRetrieve.length > 0) {
			await retrieveMissingUsers(userIdsToRetrieve, loginResult.access_token);
		}

		authStore.updateValidationTimestamp();
		set({
			isAuthenticated: true,
			accessToken: loginResult.access_token,
			refreshToken: loginResult.refresh_token,
			profileVersion: loginResult.profile_version,
			avatarVersion: loginResult.avatar_version,
			user: loginResultUser,
			loading: false
		});
	}

	function clearLoginStorage() {
		accessTokenValue.set('');
		refreshTokenValue.set('');
		profileVersionValue.set(0);
		avatarVersionValue.set(0);
		userDetail.set({});
		userAvatar.set('');
		lastValidationTime.set(0);
		shouldUpdateAvatar.set(true);
		friendStore.clear();
		userStore.clear();
		avatarStore.clear();
		localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
		localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
		localStorage.removeItem(STORAGE_KEY_PROFILE_VERSION);
		localStorage.removeItem(STORAGE_KEY_AVATAR_VERSION);
		localStorage.removeItem(STORAGE_KEY_USER_DETAIL);
		localStorage.removeItem(STORAGE_KEY_USER_AVATAR);
		localStorage.removeItem(STORAGE_KEY_SHOULD_UPDATE_AVATAR);
		localStorage.removeItem(STORAGE_KEY_LAST_VALIDATION_TIME);
	}

	return {
		subscribe,
		validateLoginResponse: async (loginResponse: LoginResponse): Promise<boolean> => {
			await handleLoginResponse(loginResponse);
			return true;
		},
		login: async (
			email: string | null,
			username: string | null,
			password: string
		): Promise<boolean> => {
			set({ ...initialState, loading: true });
			try {
				const loginResult: LoginResponse = await loginUser(email, username, password);
				await handleLoginResponse(loginResult);
				return true;
			} catch (err) {
				clearLoginStorage();
				set({
					...initialState,
					loading: false
				});
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		register: async (email: string, username: string, password: string): Promise<boolean> => {
			set({ ...initialState, loading: true });
			try {
				const registerResult: LoginResponse = await registerUser(email, username, password);
				await handleLoginResponse(registerResult);
				return true;
			} catch (err) {
				clearLoginStorage();
				set({
					...initialState,
					loading: false
				});
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		validateToken: async (): Promise<boolean> => {
			set({ ...initialState, loading: true });
			try {
				if (get(accessTokenValue)) {
					const validateResult: LoginResponse = await validateToken(get(accessTokenValue));
					await handleLoginResponse(validateResult);
				}
				return true;
			} catch (err) {
				clearLoginStorage();
				set({
					...initialState,
					loading: false
				});
				return false;
			}
		},
		validateTokenGoogle: async (googleAccessToken: string): Promise<boolean> => {
			set({ ...initialState, loading: true });
			try {
				const validateResult: LoginResponse = await loginTokenGoogle(googleAccessToken);
				await handleLoginResponse(validateResult);
				return true;
			} catch (err) {
				clearLoginStorage();
				set({
					...initialState,
					loading: false
				});
				return false;
			}
		},
		logout: async (): Promise<void> => {
			set({ ...initialState, loading: true });
			try {
				await logoutUser(get(accessTokenValue));
				clearLoginStorage();
				set({ ...initialState, loading: false });
				return;
			} catch (err) {
				clearLoginStorage();
				set({ ...initialState, loading: false });
				return;
			}
		},
		clearLogin() {
			clearLoginStorage();
			set({ ...initialState, loading: false });
		},
		authorized: async (): Promise<void> => {
			set({
				isAuthenticated: true,
				accessToken: get(accessTokenValue),
				refreshToken: get(refreshTokenValue),
				profileVersion: get(profileVersionValue),
				avatarVersion: get(avatarVersionValue),
				user: get(userDetail),
				loading: false
			});
		},
		isValidationNeeded() {
			const lastValidation = get(lastValidationTime);
			const now = Date.now();
			// For debugging
			// const oneMinute = 60 * 1000;
			const oneMinute = 0;
			return now - lastValidation > oneMinute;
		},
		updateValidationTimestamp() {
			lastValidationTime.set(Date.now());
		}
	};
}

export const authStore = createAuthStore();
