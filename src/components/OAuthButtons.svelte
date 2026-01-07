<script lang="ts">
	import {
		googleProvider,
		signInWithApple,
		signInWithGithub,
		signInWithReddit
	} from '$lib/authLib/oauth2';
	import { authStore } from '../stores/authStore';
	import { errorToast } from '../utils/toast';

	const googleLogin = googleProvider.useGoogleLogin({
		flow: 'implicit',
		onSuccess: async (tokenResponse) => {
			const loginResult = await authStore.validateTokenGoogle(tokenResponse.access_token);
			if (loginResult) {
				window.location.href = '/world';
			}
		}
	});

	const handleGoogleLogin = (event: MouseEvent) => {
		event.preventDefault();
		googleLogin();
	};

	async function handleGitHubLogin() {
		try {
			await signInWithGithub();
		} catch (err) {
			console.error('Error during GitHub login:', err);
			errorToast('An error occurred during GitHub login.');
		}
	}

	async function handleRedditLogin() {
		try {
			await signInWithReddit();
		} catch (err) {
			console.error('Error during Reddit login:', err);
			errorToast('An error occurred during Reddit login.');
		}
	}

	async function handleAppleLogin() {
		try {
			await signInWithApple();
		} catch (err) {
			console.error('Error during Apple login:', err);
			errorToast('An error occurred during Apple login.');
		}
	}
</script>

<div class="oauth-buttons">
	<button class="oauth-button google" on:click={handleGoogleLogin}>
		<img src="/oAuthButtons/google_button.png" alt="Google" class="oauth-img" />
	</button>
	<button class="oauth-button github" on:click={handleGitHubLogin}>
		<img src="/oAuthButtons/github_button.png" alt="Github" class="oauth-img" />
	</button>
	<button class="oauth-button reddit" on:click={handleRedditLogin}>
		<img src="/oAuthButtons/reddit_button.png" alt="Reddit" class="oauth-img" />
	</button>
	<button class="oauth-button apple" on:click={handleAppleLogin}>
		<img src="/oAuthButtons/apple_button.png" alt="Apple" class="oauth-img" />
	</button>
</div>

<style>
	.oauth-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		width: 100%;
		max-width: 300px;
		margin: 0 auto;
		padding: 8px;
	}

	.oauth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		background-color: transparent;
		aspect-ratio: 1;
		min-height: 60px;
		max-height: 80px;
		transition: all 0.2s ease;
		overflow: hidden;
	}

	.oauth-button:hover {
		opacity: 0.9;
		transform: scale(1.02);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.oauth-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 8px;
		transition: transform 0.2s ease;
	}

	.oauth-button:hover .oauth-img {
		transform: scale(1.05);
	}
</style>
