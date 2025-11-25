<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		accessTokenValue,
		authStore,
		avatarVersionValue,
		shouldUpdateAvatar,
		userAvatar,
		userDetail
	} from '../../stores/authStore';
	import {
		handleChangeAvatar,
		handleChangeUsername,
		handleGetAvatar
	} from '../../services/settingsService';
	import { toast } from '@zerodevx/svelte-toast';
	import EditProfileUsername from '../../components/edit_profile/EditProfileUsername.svelte';
	import EditProfileAvatar from '../../components/edit_profile/EditProfileAvatar.svelte';
	import { get } from 'svelte/store';

	let showModalAvatar = false;
	let showModalUsername = false;
	let hasFetchedAvatar = false;
	let showDropdown = false;

	function getRandomColor(username: string): string {
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = Math.abs(hash) % 360;
		return `hsl(${hue}, 70%, 50%)`;
	}

	function getInitial(username: string): string {
		return username.charAt(0).toUpperCase();
	}
	async function getAvatar(accessToken: string) {
		try {
			const response = await handleGetAvatar(accessToken);
			if (response.success && response.avatar) {
				shouldUpdateAvatar.set(false);
				userAvatar.set(response.avatar);
				hasFetchedAvatar = true;
				return true;
			} else {
				throw new Error('Failed to fetch avatar');
			}
		} catch (error) {
			toast.push('Failed to fetch avatar.', {
				theme: {
					'--toastColor': '#000000',
					'--toastBackground': '#EE4B2B',
					'--toastBarBackground': '#4A0404'
				}
			});
			hasFetchedAvatar = true;
			return false;
		}
	}

	function getUserDetails(accessToken: string) {
		if (get(shouldUpdateAvatar)) {
			getAvatar(accessToken);
		}
	}

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isAuthenticated && !state.loading) {
				goto('/');
			} else if (state.isAuthenticated && !state.loading) {
				const accessToken = $accessTokenValue;
				if (accessToken) {
					getUserDetails(accessToken);
				}
			}
		});
		return () => unsubscribe();
	});

	function handleEditProfileSaveUsername(data: { username?: string | null }) {
		if (data.username) {
			const accessToken = $accessTokenValue;
			if (accessToken) {
				handleChangeUsername(accessToken, data.username).then((response) => {
					if (response.success) {
						toast.push('Username updated successfully!');
					} else {
						toast.push('Failed to update username', {
							theme: {
								'--toastColor': '#000000',
								'--toastBackground': '#EE4B2B',
								'--toastBarBackground': '#4A0404'
							}
						});
					}
				});
			}
		}
		showModalUsername = false;
	}

	function handleEditProfileSaveAvatar(data: {
		avatar?: File | null;
		defaultAvatar?: boolean | null;
	}) {
		if (data.avatar) {
			const accessToken = $accessTokenValue;
			if (accessToken) {
				let defaultAvatar = false;
				if (data.defaultAvatar) {
					defaultAvatar = data.defaultAvatar;
				}
				handleChangeAvatar(accessToken, data.avatar, defaultAvatar).then((response) => {
					if (response.success) {
						toast.push('Avatar updated successfully!');
						avatarVersionValue.set(get(avatarVersionValue) + 1);
					} else {
						toast.push('Failed to update avatar: ' + response.message, {
							theme: {
								'--toastColor': '#000000',
								'--toastBackground': '#EE4B2B',
								'--toastBarBackground': '#4A0404'
							}
						});
					}
				});
			}
		}
		showModalAvatar = false;
	}

	function toggleDropdown() {
		showDropdown = !showDropdown;
	}

	function closeDropdown() {
		showDropdown = false;
	}

	function openUsernameModal() {
		showModalUsername = true;
		showDropdown = false;
	}

	function openAvatarModal() {
		showModalAvatar = true;
		showDropdown = false;
	}

	const handleDropdownFocusLoss = ({
		relatedTarget,
		currentTarget
	}: {
		relatedTarget: EventTarget | null;
		currentTarget: EventTarget;
	}) => {
		if (
			relatedTarget instanceof Node &&
			currentTarget instanceof Node &&
			currentTarget.contains(relatedTarget)
		) {
			return;
		}
		showDropdown = false;
	};
</script>

{#if $authStore.isAuthenticated && !$authStore.loading}
	<div class="protected-page">
		<div class="header">
			<h1>Age of Gold</h1>
			<div class="settings-container" on:focusout={handleDropdownFocusLoss}>
				<button class="settings-btn" on:click={toggleDropdown}>⚙️</button>
				<div class="dropdown-menu" style:visibility={showDropdown ? 'visible' : 'hidden'}>
					<button class="dropdown-item" on:click={openUsernameModal}>Change Username</button>
					<button class="dropdown-item" on:click={openAvatarModal}>Change Avatar</button>
					<button class="dropdown-item" on:click={() => authStore.logout()}>Logout</button>
				</div>
			</div>
		</div>
		<p>Welcome!</p>
		{#if $userAvatar}
			<img src={$userAvatar} alt="User Avatar" class="avatar-box" />
		{:else}
			<div
				class="avatar-box default-avatar"
				style="background-color: {getRandomColor($userDetail.username)}"
			>
				{getInitial($userDetail.username)}
			</div>
		{/if}
		<p class="username">{$userDetail.username}</p>
		<button class="logout-btn" on:click={() => authStore.logout()}> Logout </button>
		{#if showModalAvatar}
			<EditProfileAvatar
				onSave={handleEditProfileSaveAvatar}
				onClose={() => (showModalAvatar = false)}
			/>
		{/if}
		{#if showModalUsername}
			<EditProfileUsername
				onSave={handleEditProfileSaveUsername}
				onClose={() => (showModalUsername = false)}
			/>
		{/if}
	</div>
{:else if !$authStore.loading}
	<div class="protected-page">
		<p class="loading">Connecting...</p>
	</div>
{/if}

<style>
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

	h1 {
		color: #2c3e50;
		margin-bottom: 1.5rem;
	}

	p {
		color: #34495e;
		font-size: 1.1rem;
		margin-bottom: 1rem;
	}

	.username {
		font-weight: bold;
		color: #3498db;
		font-size: 1.2rem;
		margin-top: 0.5rem;
	}

	.logout-btn {
		background: #e74c3c;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 1rem;
	}

	.logout-btn:hover {
		background: #c0392b;
	}

	.loading {
		color: #7f8c8d;
		font-style: italic;
	}

	.avatar-box {
		width: 30vh;
		height: 30vh;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 3.5rem;
		font-weight: bold;
		object-fit: cover;
	}
	.settings-container {
		position: relative;
		display: inline-block;
		margin-left: 0.5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.settings-container {
		position: relative;
		display: inline-block;
	}

	.settings-btn {
		background: #0363a3;
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 50%;
		font-size: 1.2rem;
		cursor: pointer;
		transition: background 0.3s ease;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.settings-btn:hover {
		background: #2980b9;
	}

	.dropdown-menu {
		position: absolute;
		right: 0;
		background: white;
		border-radius: 6px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		z-index: 100;
		width: 180px;
		overflow: hidden;
	}

	.dropdown-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.95rem;
		color: #34495e;
	}

	.dropdown-item:hover {
		background: #f0f0f0;
	}
</style>
