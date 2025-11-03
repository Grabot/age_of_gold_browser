import { get, writable, type Writable } from 'svelte/store';
import { loginWithToken, loginUser } from '../services/loginService';
import { handleLogoutUser } from '../services/logoutService';


const STORAGE_KEY_ACCESS_TOKEN = 'accessToken';
const STORAGE_KEY_REFRESH_TOKEN = 'refreshToken';
const STORAGE_KEY_USER_DETAIL = 'userDetail';
const STORAGE_KEY_SHOULD_VALIDATE = 'shouldValidateFlag';

const storedValueAccessToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_ACCESS_TOKEN) : "";
const initialValueAccessToken = storedValueAccessToken ? storedValueAccessToken : "";
const storedValueRefreshToken = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_REFRESH_TOKEN) : "";
const initialValueRefreshToken = storedValueRefreshToken ? storedValueRefreshToken : "";
const storedValueShouldValidate = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_SHOULD_VALIDATE) : 'true';
const initialValueShouldValidate = storedValueShouldValidate ? JSON.parse(storedValueShouldValidate) : true;
const storedValueUserDetail = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_USER_DETAIL) : '{}';
const initialValueUserDetail = storedValueUserDetail ? JSON.parse(storedValueUserDetail) : {};


export const accessTokenValue = writable(initialValueAccessToken);
export const refreshTokenValue = writable(initialValueRefreshToken);
export const shouldValidate = writable(initialValueShouldValidate);
export const userDetail = writable(initialValueUserDetail);

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
shouldValidate.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_SHOULD_VALIDATE, JSON.stringify(value));
	}
});
userDetail.subscribe((value) => {
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY_USER_DETAIL, JSON.stringify(value));
	}
});


interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  loading: true,
  error: null,
};

// Create a custom store with methods
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);

  return {
    subscribe,
    login: async (email: string, username: string, password: string): Promise<void> => {
        set({ ...initialState, loading: true });
      try {
        const result = await loginUser(email, username, password);
        if (!result.success) {
          throw new Error('Token invalid');
        }
        if (!result.accessToken || !result.refreshToken) {
          throw new Error('token not available');
        }
        set({
          isAuthenticated: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          ...initialState,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    authorized: async (): Promise<void> => {
      const accessToken = get(accessTokenValue);
      const refreshToken = get(refreshTokenValue)
      shouldValidate.set(true);
      set({
          isAuthenticated: true,
          accessToken: accessToken,
          refreshToken: refreshToken,
          loading: false,
          error: null,
        });
    },
    validateToken: async (): Promise<void> => {
      set({ ...initialState, loading: true });
      try {
        const accessToken = get(accessTokenValue);
        if (accessToken == "") {
          set({ ...initialState, loading: false });
          return;
        }
        const result = await loginWithToken(accessToken);
        if (!result.success) {
          throw new Error('Token invalid');
        }
        if (!result.accessToken || !result.refreshToken) {
          throw new Error('token not available');
        }
        set({
          isAuthenticated: true,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          ...initialState,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    },
    logout: async (): Promise<void> => {
        const accessToken = get(accessTokenValue)
        if (!accessToken) {
          set({ ...initialState, loading: false });
          return;
        }
        await handleLogoutUser(accessToken);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ ...initialState, loading: false });
    },
  };
}

// Export the custom store
export const auth = createAuthStore();
