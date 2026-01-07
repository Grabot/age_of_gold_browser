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
		<p>Logged in as: {$authStore.user.username}</p>
		<div class="button-container">
			<button class="play-button" on:click={goToWorld}>Play</button>
			<button class="logout-button" on:click={handleLogout}>Logout</button>
		</div>
	{/if}
</div>

<style>
	.logged-in-message {
		padding: 20px;
		text-align: center;
		font-size: 1.2em;
		color: #000; /* Changed text color to black */
	}

	.button-container {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-top: 20px;
	}

	.play-button,
	.logout-button {
		padding: 10px 20px;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1em;
	}

	.play-button {
		background-color: #4caf50;
		color: white;
	}

	.logout-button {
		background-color: #f44336;
		color: white;
	}
</style>
