<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore } from '../stores/authStore';

	function handleLogout() {
		authStore.logout();
	}

	function goToWorld() {
		goto('/world');
	}
</script>

<div class="logged-in-message">
	{#if $authStore.isAuthenticated && !$authStore.loading && $authStore.user}
		<div class="user-info">
			<p class="welcome-text">
				Welcome back, <span class="username">{$authStore.user.username}</span>!
			</p>
		</div>
		<div class="button-container">
			<button class="play-button" on:click={goToWorld}>Play</button>
			<button class="logout-button" on:click={handleLogout}>Logout</button>
		</div>
	{/if}
</div>

<style>
	.logged-in-message {
		padding: 2rem;
		text-align: center;
		font-size: 1.2em;
		color: #000;
		background-color: #c29b73;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0d5c8;
		max-width: 350px;
		margin: 0 auto;
		transition:
			transform 0.3s ease,
			box-shadow 0.3s ease;
		position: relative;
		overflow: hidden;
	}

	.logged-in-message:hover {
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
	}

	.logged-in-message::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #4caf50, #3e8e41);
	}

	.user-info {
		margin-bottom: 1.5rem;
	}

	.welcome-text {
		font-size: 1.2rem;
		color: #5a3e2a;
		margin: 0;
		font-family: 'Georgia', serif;
	}

	.username {
		font-weight: 600;
		color: #5a3610;
		font-family: 'Georgia', serif;
	}

	.button-container {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.play-button,
	.logout-button {
		padding: 12px 24px;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		font-family: 'Georgia', serif;
	}

	.play-button {
		background-color: #4caf50;
		color: white;
	}

	.play-button:hover {
		background-color: #3e8e41;
	}

	.logout-button {
		background-color: #f44336;
		color: white;
	}

	.logout-button:hover {
		background-color: #d32f2f;
	}
</style>
