<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getTokenFromUrl } from '$lib/authLib';
	import { accessTokenValue, authStore } from '../../../stores/authStore';
	import { toast } from '@zerodevx/svelte-toast';
	import { logoutUser, resetPassword } from '$lib/authLib/apiClient';
	import { get } from 'svelte/store';

	let showForm = true;
	let loading = true;
	let error = '';
	let formError = '';
	let newPassword = '';
	let message = '';

	onMount(async () => {
		try {
			const currentUrl = new URL(window.location.href);
			const token = getTokenFromUrl(currentUrl);

			if (token) {
				accessTokenValue.set(token);
				if (await authStore.validateToken()) {
					// Token validated, password form shown
				} else {
					error =
						'The token has expired, apologies for the inconvenience. \nPlease try again or contact support if the issue persists.';
					toast.push('The token has expired.', {
						theme: {
							'--toastColor': '#000000',
							'--toastBackground': '#EE4B2B',
							'--toastBarBackground': '#4A0404'
						}
					});
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

	const handleSubmit = async () => {
		formError = '';
		message = '';
		if (!newPassword) {
			formError = 'No password given.';
			return;
		}

		loading = true;
		try {
			const resetPasswordResult: boolean = await resetPassword(newPassword, get(accessTokenValue));
			if (!resetPasswordResult) {
				throw new Error('Failed to send reset email');
			} else {
				showForm = false;
				toast.push('Password reset done! Please login again.');
				await authStore.logout();
				setTimeout(() => {
					goto('/');
				}, 1000);
			}
		} catch (err) {
			toast.push('Failed to reset password', {
				theme: {
					'--toastColor': '#000000',
					'--toastBackground': '#EE4B2B',
					'--toastBarBackground': '#4A0404'
				}
			});
			formError = 'Network error. Please try again.';
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
		{:else if showForm}
			<div class="reset-password-container w-full">
				<h1 class="mb-6 text-2xl font-bold text-white">Reset Your Password</h1>

				{#if formError}
					<div class="bg-opacity-50 mb-4 rounded bg-red-900 p-3 text-red-200">{formError}</div>
				{/if}

				{#if message}
					<div class="bg-opacity-50 mb-4 rounded bg-green-900 p-3 text-green-200">{message}</div>
				{/if}

				<form on:submit|preventDefault={handleSubmit} class="space-y-4">
					<div class="form-group">
						<label for="newPassword" class="mb-1 block text-sm font-medium text-gray-300"
							>New Password</label
						>
						<input
							type="password"
							id="newPassword"
							bind:value={newPassword}
							placeholder="Enter new password"
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
						{loading ? 'Updating...' : 'Reset Password'}
					</button>
				</form>
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
				<p class="mt-4 text-lg text-white">
					Password reset successful! Logged in and redirecting shortly.
				</p>
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
