import { PUBLIC_BASE_URL } from "$env/static/public";

export async function signInWithApple() {

  try {
    // TODO: api url? move to env?
    window.location.href = PUBLIC_BASE_URL + '/api/v1.0/auth/apple';
  } catch (error) {
    console.error('Error during Apple login:', error);
    throw error;
  }
}
