import type { User } from "../types/user";
import { user } from '../stores/userStore';

const LOGIN_URL = "http://localhost:5000/api/v1.0/login";
const TOKEN_URL = "http://localhost:5000/api/v1.0/login/token";
const REFRESH_URL = "http://localhost:5000/api/v1.0/login/refresh";


export async function loginUser(email: string, username: string, password: string) {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ "email": email, "username": username, "password": password })
    });
    if (!response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      const errorData = await response.json();
      throw new Error(errorData.message || 'Login failed.');
    }
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    const user_login: User = {
      id: data.user.id,
      username: data.user.username,
    };
    user.set(user_login);
    localStorage.setItem('user', JSON.stringify(user_login));
    return { success: true};
  } catch (err) {
    return { success: false, message: (err as Error).message || 'An error occurred during login.' };
  }
}

export async function loginWithToken(token: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      // Access token was not valid, check a refresh.
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        return refreshTokenLogin(token, refreshToken);
      } else {
        throw new Error('Unauthorized access. Please login again.');
      }
    }

    if (!response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw new Error('Failed to authenticate with token');
    }

    const data = await response.json();
    if (!data.result || !data.access_token || !data.refresh_token) {
      return {success: false, message: 'Login failed'};
    }

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);

    return { success: true };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}

export function validateLoginFields(password: string, email: string, username: string, useEmailForLogin: boolean) {
  if (!password) {
    return { success: false, message: 'Please fill in all fields.' };
  }
  if (useEmailForLogin) {
    if (!email) {
      return { success: false, message: 'Please fill in all fields' };
    }
  } else {
    if (!username) {
      return { success: false, message: 'Please fill in all fields' };
    }
  }
  return { success: true };
}

export async function refreshTokenLogin(accessToken: string, refreshToken: string): Promise<{ success: boolean; message?: string; }> {
  try {
    const response = await fetch(REFRESH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ "refresh_token": refreshToken })
    });
    if (response.status === 401) {
      throw new Error('Unauthorized access. Please login again.');
    }

    if (!response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw new Error('Failed to authenticate with token');
    }

    const data = await response.json();
    if (!data.result || !data.access_token || !data.refresh_token) {
      return {success: false, message: 'Login failed'};
    }

    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    debugger;

    return { success: true };
  } catch (err) {
    return { success: false, message: (err as Error).message };
  }
}
