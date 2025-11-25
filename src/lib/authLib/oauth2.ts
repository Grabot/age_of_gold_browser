
export async function signInWithApple(): Promise<void> {
  try {
    const baseUrl: string = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    window.location.href = baseUrl + '/api/v1.0/auth/apple';
  } catch (error: unknown) {
    console.error('Error during Apple login:', error);
    throw error;
  }
}


export async function signInWithGithub(): Promise<void> {
  try {
    const baseUrl: string = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    window.location.href = baseUrl + '/api/v1.0/auth/github';
  } catch (error: unknown) {
    console.error('Error during Github login:', error);
    throw error;
  }
}


export async function signInWithGoogle(): Promise<void> {
  try {
    const baseUrl: string = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    window.location.href = baseUrl + '/api/v1.0/auth/google';
  } catch (error: unknown) {
    console.error('Error during Google login:', error);
    throw error;
  }
}



export async function signInWithReddit(): Promise<void> {
  try {
    const baseUrl: string = import.meta.env.VITE_PUBLIC_BASE_URL || '';
    window.location.href = baseUrl + '/api/v1.0/auth/reddit';
  } catch (error: unknown) {
    console.error('Error during Reddit login:', error);
    throw error;
  }
}
