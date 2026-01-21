<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteAccountRequest, confirmDeleteAccount } from '$lib/api/authApi';
	import { onMount } from 'svelte';
	import { getTokenFromUrl } from '$lib/authLib';
	import { accessTokenValue, authStore } from '$lib/stores/authStore';
	import { get } from 'svelte/store';
	import { errorToast, successToast } from '$lib/utils/toast';

	let email = '';
	let loading = false;
	let error = '';
	let success = false;
	let message = '';
	let showConfirmation = false;

	onMount(async () => {
		try {
			const currentUrl = new URL(window.location.href);
			const token = getTokenFromUrl(currentUrl);

			if (token) {
				accessTokenValue.set(token);
				if (await authStore.validateToken()) {
					showConfirmation = true;
				} else {
					error = 'The token has expired or is invalid. Please try again or contact support.';
					errorToast(error);
				}
			}
		} catch (err) {
			error = 'An error occurred during authentication.';
			errorToast(error);
			console.error('Exception occurred during authentication callback:', err);
		} finally {
			loading = false;
		}
	});

	const handleSubmit = async () => {
		loading = true;
		error = '';
		message = '';
		success = false;

		if (!email) {
			error = 'Please enter your email address.';
			loading = false;
			return;
		}

		try {
			const result = await deleteAccountRequest(email);
			if (result) {
				success = true;
				message = 'If an account with that email exists, a deletion link has been sent.';
				successToast(message);
			} else {
				error = 'Failed to send deletion link. Please try again.';
				errorToast(error);
			}
		} catch (err) {
			error =
				'An error occurred: ' +
				(err instanceof Error ? err.message : 'Unknown error') +
				'. Please try again.';
			errorToast(error);
			console.error('Exception occurred during delete account request:', err);
		} finally {
			loading = false;
		}
	};

	const handleDelete = async () => {
		loading = true;
		error = '';
		message = '';
		success = false;

		try {
			const result = await confirmDeleteAccount(get(accessTokenValue));
			if (result) {
				success = true;
				message = 'Your account has been deleted. Redirecting to home page.';
				successToast(message);
				authStore.clearLogin();
				setTimeout(() => {
					goto('/');
				}, 1500);
			} else {
				error = 'Failed to delete account. Please try again.';
				errorToast(error);
			}
		} catch (err) {
			error =
				'An error occurred: ' +
				(err instanceof Error ? err.message : 'Unknown error') +
				'. Please try again.';
			errorToast(error);
			console.error('Exception occurred during account deletion:', err);
		} finally {
			loading = false;
		}
	};
</script>

<div class="flex h-screen w-full flex-col items-center justify-center bg-gray-800">
	<div class="w-full max-w-md rounded-lg bg-gray-900 p-8 shadow-lg">
		{#if loading}
			<div class="flex flex-col items-center">
				<div
					class="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
				></div>
				<p class="mt-4 text-lg text-white">
					{showConfirmation ? 'Deleting account...' : 'Sending deletion link...'}
				</p>
			</div>
		{:else if success}
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
				<p class="mt-4 text-lg text-white">{message}</p>
				<button
					class="mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					on:click={() => goto('/')}
				>
					Return to home page
				</button>
			</div>
		{:else if showConfirmation}
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
				<p class="mt-4 text-lg text-white">
					Are you sure you want to delete your account? This action cannot be undone.
				</p>
				<button
					on:click={handleDelete}
					class="mt-4 rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
				>
					Delete accounts associated with email
				</button>
			</div>
		{:else}
			<div class="deletion-password-container w-full">
				<h1 class="mb-6 text-2xl font-bold text-white">Delete your account</h1>

				{#if error}
					<div class="bg-opacity-50 mb-4 rounded bg-red-900 p-3 text-red-200">{error}</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div class="form-group">
						<label for="email" class="mb-1 block text-sm font-medium text-gray-300"
							>Email Address</label
						>
						<input
							type="email"
							id="email"
							bind:value={email}
							placeholder="Enter your email"
							required
							class="w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						aria-disabled={loading}
						class="w-full rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 focus:outline-none disabled:bg-gray-600"
					>
						{loading ? 'Sending...' : 'Send Delete Link'}
					</button>
				</form>
			</div>
		{/if}
	</div>
</div>

<style>
	.form-group {
		margin-bottom: 1rem;
	}
	input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
	}
	button {
		background: #4a6fa5;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
	}
	button:disabled {
		background: #ccc;
	}
</style>
