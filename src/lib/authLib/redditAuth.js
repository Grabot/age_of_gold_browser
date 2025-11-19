import { PUBLIC_BASE_URL } from "$env/static/public";

export async function signInWithReddit() {

  try {
    // TODO: api url? move to env?
    window.location.href = PUBLIC_BASE_URL + '/api/v1.0/auth/reddit';
  } catch (error) {
    console.error('Error during Reddit login:', error);
    throw error;
  }
}
