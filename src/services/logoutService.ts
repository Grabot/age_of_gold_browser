
const LOGOUT_URL = "http://localhost:5000/api/v1.0/logout";


export async function handleLogoutUser(accessToken: string): Promise<{ success: boolean; message?: string; }> {
  try {
    // TODO: Change to get? no variables?
    const response = await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      return {success: true}
    } else {
      const refreshToken = localStorage.getItem('refreshToken');
      // TODO: Add failed retry with refresh?
      return { success: false, message: 'Logout failed.' };
    }
  } catch (err) {
    return { success: false, message: (err as Error).message || 'An error occurred during login.' };
  }
}
