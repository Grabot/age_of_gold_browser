import { get, writable } from 'svelte/store';
import type { User } from '../types/user';
import { getUserDetail, loginTokenGoogle, loginUser, logoutUser, registerUser, validateToken, type LoginResponse } from '$lib/authLib/apiClient';
import { toast } from '@zerodevx/svelte-toast';


export const STORAGE_KEY_ACCESS_TOKEN = 'accessToken';
export const STORAGE_KEY_REFRESH_TOKEN = 'refreshToken';
export const STORAGE_KEY_PROFILE_VERSION = 'profileVersion';
export const STORAGE_KEY_AVATAR_VERSION = 'avatarVersion';
export const STORAGE_KEY_SHOULD_UPDATE_AVATAR = 'shouldUpdateAvatarFlag';
export const STORAGE_KEY_LAST_VALIDATION_TIME = 'lastValidationTimeFlag';
export const STORAGE_KEY_USER_DETAIL = 'userDetail';
export const STORAGE_KEY_USER_AVATAR = 'userAvatar';

const storedValueAccessToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN) : "";
const initialValueAccessToken = storedValueAccessToken ? storedValueAccessToken : "";
export const accessTokenValue = writable(initialValueAccessToken);

const storedValueRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN) : "";
const initialValueRefreshToken = storedValueRefreshToken ? storedValueRefreshToken : "";
export const refreshTokenValue = writable(initialValueRefreshToken);

const storedValueProfileVersion = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_PROFILE_VERSION) : 0;
const initialValueProfileVersion = storedValueProfileVersion ? Number(storedValueProfileVersion) : 0;
export const profileVersionValue = writable(initialValueProfileVersion);

const storedValueAvatarVersion = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_AVATAR_VERSION) : 0;
const initialValueAvatarVersion = storedValueAvatarVersion ? Number(storedValueAvatarVersion) : 0;
export const avatarVersionValue = writable(initialValueAvatarVersion);

const storedValueShouldUpdateAvatar = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SHOULD_UPDATE_AVATAR) : "true";
const initialValueShouldUpdateAvatar = storedValueShouldUpdateAvatar ? JSON.parse(storedValueShouldUpdateAvatar) : true;
export const shouldUpdateAvatar = writable(initialValueShouldUpdateAvatar);

const storedValueLastValidationTime = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LAST_VALIDATION_TIME) : null;
const initialValueLastValidationTime = storedValueLastValidationTime ? Number(storedValueLastValidationTime) : 0;
export const lastValidationTime = writable(initialValueLastValidationTime);

const storedValueUserDetail = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_DETAIL) : "{}";
const initialValueUserDetail = storedValueUserDetail ? JSON.parse(storedValueUserDetail) : {};
export const userDetail = writable(initialValueUserDetail);

const storedValueUserAvatar = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_AVATAR) : "";
const initialValueUserAvatar = storedValueUserAvatar ? storedValueUserAvatar : "";
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
  loading: true,
};

function createAuthStore() {
  const { subscribe, set } = writable<AuthState>(initialState);

  async function handleLoginResponse(loginResult: LoginResponse) {
    accessTokenValue.set(loginResult.access_token);
    refreshTokenValue.set(loginResult.refresh_token);
    let loginResultUser;
    if (get(profileVersionValue) != loginResult.profile_version) {
      const newUserDetail = await getUserDetail(loginResult.access_token);
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
    authStore.updateValidationTimestamp();
    set({
      isAuthenticated: true,
      accessToken: loginResult.access_token,
      refreshToken: loginResult.refresh_token,
      profileVersion: loginResult.profile_version,
      avatarVersion: loginResult.avatar_version,
      user: loginResultUser,
      loading: false,
    });
  }

  function clearLoginStorage() {
    accessTokenValue.set("")
    refreshTokenValue.set("");
    profileVersionValue.set(0);
    avatarVersionValue.set(0);
    userDetail.set({});
    userAvatar.set("");
    lastValidationTime.set(0);
    localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEY_PROFILE_VERSION);
    localStorage.removeItem(STORAGE_KEY_AVATAR_VERSION);
    localStorage.removeItem(STORAGE_KEY_USER_DETAIL);
    localStorage.removeItem(STORAGE_KEY_USER_AVATAR);
  }

  return {
    subscribe,
    validateLoginResponse: async (loginResponse: LoginResponse): Promise<boolean> => {
      await handleLoginResponse(loginResponse);
      return true;
    },
    login: async (email: string | null, username: string | null, password: string): Promise<boolean> => {
      set({ ...initialState, loading: true });
      try {
        const loginResult: LoginResponse = await loginUser(email, username, password);
        await handleLoginResponse(loginResult);
        return true;
      } catch (err) {
        clearLoginStorage();
        set({
          ...initialState,
          loading: false,
        });
        toast.push(err instanceof Error ? err.message : 'Unknown error', {
          theme: {
            '--toastColor': '#000000',
            '--toastBackground': '#EE4B2B',
            '--toastBarBackground': '#4A0404'
          }
        });
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
          loading: false,
        });
        toast.push(err instanceof Error ? err.message : 'Unknown error', {
          theme: {
            '--toastColor': '#000000',
            '--toastBackground': '#EE4B2B',
            '--toastBarBackground': '#4A0404'
          }
        });
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
          loading: false,
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
          loading: false,
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
    authorized: async (): Promise<void> => {
      set({
        isAuthenticated: true,
        accessToken: get(accessTokenValue),
        refreshToken: get(refreshTokenValue),
        profileVersion: get(profileVersionValue),
        avatarVersion: get(avatarVersionValue),
        user: get(userDetail),
        loading: false,
      });
    },
    isValidationNeeded() {
      const lastValidation = get(lastValidationTime);
      const now = Date.now();
      const oneMinute = 60 * 1000;
      return now - lastValidation > oneMinute;
    },
    updateValidationTimestamp() {
      lastValidationTime.set(Date.now());
    }
  };
}

export const authStore = createAuthStore();
