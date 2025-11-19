import { PUBLIC_BASE_URL } from "$env/static/public";

export async function signInWithGoogle() {

  try {
    // TODO: api url? move to env?
    window.location.href = PUBLIC_BASE_URL + '/api/v1.0/auth/google';
  } catch (error) {
    console.error('Error during Google login:', error);
    throw error;
  }
}
