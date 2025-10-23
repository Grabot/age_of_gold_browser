
const LOGOUT_URL = "http://localhost:5000/api/v1.0/logout";


export async function logoutUser() {
  const accessToken = localStorage.getItem('access_token');
  try {
    // TODO: Change to get? no variables
    const response = await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    if (response.ok) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return {success: true}
    } else {
      const refreshToken = localStorage.getItem('refresh_token');
      // TODO: Add failed retry with refresh.
      return { success: false, message: 'Logout failed.' };
    }
  } catch (err) {
    return { success: false, message: (err as Error).message || 'An error occurred during login.' };
  }
}
