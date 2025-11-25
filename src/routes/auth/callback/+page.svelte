<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTokenFromUrl } from '$lib/authLib';
	import { accessTokenValue, authStore } from '../../../stores/authStore';
	import { toast } from '@zerodevx/svelte-toast';

	let loading = true;
	let error = '';

	onMount(async () => {
		try {
			const currentUrl = new URL(window.location.href);
			const token = getTokenFromUrl(currentUrl);

			if (token) {
				accessTokenValue.set(token);
				if (await authStore.validateToken()) {
					authStore.updateValidationTimestamp();

					setTimeout(() => {
						goto('/world');
					}, 1000);
				} else {
					error =
						'There was an issue with the token validation, apologies for the inconvenience. \nPlease try again or contact support if the issue persists.';
					toast.push(
						'There was an issue with the token validation, apologies for the inconvenience. \nPlease try again or contact support if the issue persists.',
						{
							theme: {
								'--toastColor': '#000000',
								'--toastBackground': '#EE4B2B',
								'--toastBarBackground': '#4A0404'
							}
						}
					);
				}
			} else {
				error = 'Authentication token not found.';
				toast.push('Authentication token not found.', {
					theme: {
						'--toastColor': '#000000',
						'--toastBackground': '#EE4B2B',
						'--toastBarBackground': '#4A0404'
					}
				});
			}
		} catch (err) {
			error = 'An error occurred during authentication.';
			toast.push('An error occurred during authentication.', {
				theme: {
					'--toastColor': '#000000',
					'--toastBackground': '#EE4B2B',
					'--toastBarBackground': '#4A0404'
				}
			});
			console.error('Exception occurred during authentication callback:', err);
		} finally {
			loading = false;
		}
	});
</script>

<div class="flex h-screen w-full flex-col items-center justify-center bg-gray-800">
	<div class="rounded-lg bg-gray-900 p-8 shadow-lg">
		{#if loading}
			<div class="flex flex-col items-center">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-lg text-white">Processing authentication...</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center text-red-500">
				<svg
					class="h-12 w-12"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<p class="mt-4 text-lg text-white">{error}</p>
				<button
					class="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					on:click={() => goto('/')}
				>
					Return to home page
				</button>
			</div>
		{:else}
			<div class="flex flex-col items-center text-green-500">
				<svg
					class="h-12 w-12"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
				<p class="mt-4 text-lg text-white">Login successful! Redirecting shortly.</p>
			</div>
		{/if}
	</div>
</div>
