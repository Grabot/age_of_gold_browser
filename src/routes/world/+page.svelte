<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { authStore } from '../../stores/authStore';

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isAuthenticated && !state.loading) {
				goto('/');
			}
		});
		return () => unsubscribe();
	});
</script>

{#if $authStore.isAuthenticated && !$authStore.loading}
	<div class="page-container">
		<div class="main-content">
			<p>TODO</p>
		</div>
	</div>
{:else if !$authStore.loading}
	<div class="protected-page">
		<p class="loading">Connecting...</p>
	</div>
{/if}

<style>
	.page-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.main-content {
		max-width: 1200px;
		margin: 6rem auto;
		padding: 2rem;
		text-align: center;
		background: #f9f9f9;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.protected-page {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 2rem;
		text-align: center;
		background: #f9f9f9;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	p {
		color: #34495e;
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}

	.loading {
		color: #7f8c8d;
		font-style: italic;
	}
</style>
