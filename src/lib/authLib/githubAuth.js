import { PUBLIC_BASE_URL } from "$env/static/public";

export async function signInWithGithub() {

  try {
    // TODO: api url? move to env?
    window.location.href = PUBLIC_BASE_URL + '/api/v1.0/auth/github';
  } catch (error) {
    console.error('Error during Github login:', error);
    throw error;
  }
}
