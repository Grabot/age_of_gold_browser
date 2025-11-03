import type { User } from "../types/user";
import { accessTokenValue, refreshTokenValue, shouldValidate } from "../stores/auth";

const BACKEND_URL_REGISTER = "http://localhost:5000/api/v1.0/register";

export async function registerUser(email: string, username: string, password: string) {
  try {
    const response = await fetch(BACKEND_URL_REGISTER, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', },
      body: JSON.stringify({
        "email": email,
        "username": username,
        "password": password
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Registration failed.');
    }
    const data = await response.json();
    // TODO: check keys in dict?
    accessTokenValue.set(data.access_token);
    refreshTokenValue.set(data.refresh_token);
    const user_register: User = {
      id: data.user.id,
      username: data.user.username,
    };
    // TODO: Set user details
    // user.set(user_register)
    localStorage.setItem('user', JSON.stringify(data.user));
	  shouldValidate.set(false);
    return { success: true, message: data.message || 'Account created successfully! Redirecting...' };
  } catch (err) {
    return { success: false, message: (err as Error).message || 'An error occurred during registration.' };
  }
}

export function validateRegisterFields(email: string, username: string, password: string) {
  if (!email || !username || !password) {
    return { success: false, message: 'Please fill in all fields.' };
  }
  return { success: true };
}
