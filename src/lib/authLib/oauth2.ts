import { GoogleOAuthProvider } from 'google-oauth-gsi';

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

export const googleProvider = new GoogleOAuthProvider({
	clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
	onScriptLoadError: () => console.log('onScriptLoadError'),
	onScriptLoadSuccess: () => console.log('onScriptLoadSuccess')
});

export async function signInWithReddit(): Promise<void> {
	try {
		const baseUrl: string = import.meta.env.VITE_PUBLIC_BASE_URL || '';
		window.location.href = baseUrl + '/api/v1.0/auth/reddit';
	} catch (error: unknown) {
		console.error('Error during Reddit login:', error);
		throw error;
	}
}
