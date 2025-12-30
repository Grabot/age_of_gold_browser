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
		handleDeleteAccount,
		handleGetAvatar
	} from '../../services/settingsService';
	import EditProfileUsername from '../../components/edit_profile/EditProfileUsername.svelte';
	import EditProfileAvatar from '../../components/edit_profile/EditProfileAvatar.svelte';
	import { get } from 'svelte/store';
	import EditProfilePassword from '../../components/edit_profile/EditProfilePassword.svelte';
	import DeleteAccount from '../../components/edit_profile/DeleteAccount.svelte';
	import { resetPassword } from '$lib/api/authApi';
	import { errorToast, successToast } from '../../utils/toast';

	let showModalAvatar = false;
	let showModalUsername = false;
	let showModalPassword = false;
	let showModalDeleteAccount = false;
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

	onMount(() => {
		const unsubscribe = authStore.subscribe((state) => {
			if (!state.isAuthenticated && !state.loading) {
				goto('/');
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
						successToast('Username updated successfully!');
					} else {
						errorToast('Failed to update username');
					}
				});
			}
		}
		showModalUsername = false;
	}

	async function handleEditProfileSavePassword(data: { password?: string | null }) {
		try {
			if (data.password) {
				const resetPasswordResult: boolean = await resetPassword(
					data.password,
					get(accessTokenValue)
				);
				if (!resetPasswordResult) {
					throw new Error('Failed to send reset email');
				} else {
					successToast('Password changed!');
				}
			} else {
				throw new Error('No password provided');
			}
		} catch (err) {
			errorToast('Failed to change password');
		} finally {
			showModalPassword = false;
		}
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
						successToast('Avatar updated successfully!');
						avatarVersionValue.set(get(avatarVersionValue) + 1);
					} else {
						errorToast('Failed to update avatar: ' + response.message);
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

	function openPasswordModal() {
		showModalPassword = true;
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

	function openDeleteAccountModal() {
		showModalDeleteAccount = true;
		showDropdown = false;
	}

	function handleDeleteAccountChoice() {
		const accessToken = $accessTokenValue;
		if (accessToken) {
			handleDeleteAccount(accessToken).then(async (response) => {
				if (response.success) {
					errorToast('Account deleted!');
					authStore.clearLogin();
				} else {
					errorToast('Failed to Delete account: ' + response.message);
				}
			});
		}
		showModalDeleteAccount = false;
	}

	function toggleHome() {
		window.location.href = '/world';
	}
</script>

{#if $authStore.isAuthenticated && !$authStore.loading}
	<div class="page-container">
		<div class="main-content">
			<div class="main-content-header">
				<div class="settings-container" on:focusout={handleDropdownFocusLoss}>
					<button class="settings-btn" on:click={toggleDropdown}>⚙️</button>
					<div class="dropdown-menu" style:visibility={showDropdown ? 'visible' : 'hidden'}>
						<button class="dropdown-item" on:click={openUsernameModal}>Change Username</button>
						<button class="dropdown-item" on:click={openAvatarModal}>Change Avatar</button>
						<button class="dropdown-item" on:click={openPasswordModal}>Change Password</button>
						<hr class="dropdown-divider" />
						<button class="dropdown-item" on:click={() => authStore.logout()}>Logout</button>
						<button class="dropdown-item delete-item" on:click={openDeleteAccountModal}>Delete Account</button>
					</div>
				</div>
			</div>
			<div class="avatar-container">
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
				<p>Welcome!</p>
				<p class="username">{$userDetail.username}</p>
			</div>
		</div>

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
		{#if showModalPassword}
			<EditProfilePassword
				onSave={handleEditProfileSavePassword}
				onClose={() => (showModalPassword = false)}
			/>
		{/if}
		{#if showModalDeleteAccount}
			<DeleteAccount
				onSave={handleDeleteAccountChoice}
				onClose={() => (showModalDeleteAccount = false)}
			/>
		{/if}
	</div>
{:else if !$authStore.loading}
	<div class="protected-page">
		<p class="loading">Connecting...</p>
	</div>
{/if}

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0;
		font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	}

	.main-content {
		width: 1200px;
		margin: 6rem auto;
		padding: 3rem;
		text-align: center;
		background: #f9f9f9;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		position: relative;
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

	.username {
		font-weight: bold;
		color: #3498db;
		font-size: 1.2rem;
		margin-top: 0.5rem;
	}

	.loading {
		color: #7f8c8d;
		font-style: italic;
	}

	.avatar-container {
		position: relative;
		margin-top: -2rem;
	}

	.avatar-box {
		width: 30vh;
		height: 30vh;
		position: relative;
		margin: 0 auto 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 3.5rem;
		font-weight: bold;
		object-fit: cover;
		z-index: 1;
	}

	.main-content-header {
		display: flex;
		justify-content: flex-end;
		margin-bottom: 0;
		position: relative;
		z-index: 2;
	}

	.settings-container {
		position: relative;
		display: inline-block;
	}

	.settings-btn {
		background: transparent;
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
		background: #095c39;
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

	.dropdown-divider {
		border: 0;
		border-top: 1px solid #eee;
		margin: 0.5rem 0;
	}

	.delete-item {
		color: #e74c3c !important;
		font-weight: bold;
	}
</style>
