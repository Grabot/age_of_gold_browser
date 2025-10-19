const LOGIN_URL = "http://localhost:5000/api/v1.0/login";
const TOKEN_URL = "http://localhost:5000/api/v1.0/login/token";

export async function loginUser(email: string, username: string, password: string) {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({ email, username, password })
    });
    if (!response.ok) {
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
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return { success: true, message: data.message || 'Login successful! Redirecting...' };
  } catch (err) {
    return { success: false, message: (err as Error).message || 'An error occurred during login.' };
  }
}

export async function loginWithToken(token: string): Promise<{ success: boolean; message?: string; user?: any }> {
  try {
    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      throw new Error('Failed to authenticate with token');
    }

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    return { success: true, user: data.user };
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

