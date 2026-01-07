<script lang="ts">
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount, onDestroy } from 'svelte';
	import { authStore, shouldUpdateAvatar, userAvatar, userDetail } from '../stores/authStore';
	import { friendStore } from '../stores/friendStore';
	import { avatarStore } from '../stores/avatarStore';
	import {
		connectSocket,
		disconnectSocket,
		joinRoom,
		leaveRoom,
		onMessageEvent,
		offMessageEvent,
		onChatAddedEvent,
		onUsernameUpdatedEvent,
		onFriendRequestReceivedEvent,
		onAvatarUpdatedEvent,
		onFriendRequestAcceptedEvent,
		onFriendRequestRejectedEvent,
		onFriendRequestCanceledEvent,
		onFriendRemovedEvent,
		offChatAddedEvent,
		offUsernameUpdatedEvent,
		offFriendRequestReceivedEvent,
		offAvatarUpdatedEvent,
		offFriendRequestAcceptedEvent,
		offFriendRequestRejectedEvent,
		offFriendRequestCanceledEvent,
		offFriendRemovedEvent
	} from '$lib/socket';
	import { handleGetAvatar } from '../services/settingsService';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Socket } from 'socket.io-client';
	import { get } from 'svelte/store';
	import { errorToast } from '../utils/toast';
	import ChatView from '../components/chat/ChatView.svelte';
	import FriendView from '../components/chat/FriendView.svelte';
	import { userStore } from '../stores/userStore';

	let { children } = $props();
	const options = {};

	let socket: Socket | null = null;
	let userId: number | null = null;
	let hasFetchedAvatar = false;
	let showProfileDropdown = $state(false);
	let showChatModal = $state(false);
	let showFriendModal = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);

	function toggleProfileDropdown() {
		showProfileDropdown = !showProfileDropdown;
	}

	function handleLogout() {
		authStore.logout();
		goto('/');
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
			errorToast('Failed to fetch avatar.');
			hasFetchedAvatar = true;
			return false;
		}
	}

	function getUserDetails(accessToken: string) {
		if (get(shouldUpdateAvatar)) {
			getAvatar(accessToken);
		}
	}

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

	function handleMessageEvent(message: string) {
		console.log('socket message:', message);
	}

	function handleMessageChatAddedEvent(message: string) {
		console.log('socket message:', message);
	}

	function handleUsernameUpdatedEvent(data: any) {
		friendStore.updateFriendUsername(data.user_id, data.new_username, data.profile_version);
	}

	function handleFriendRequestReceivedEvent(data: any) {
		friendStore.addFriendRequest(data);
	}

	function handleAvatarUpdatedEvent(data: any) {
		avatarStore.updateAvatarVersion(data.user_id);
	}

	function handleFriendRequestAcceptedEvent(data: any) {
		const updatedUser = {
			id: data.friend_id,
			username: data.username,
			avatar_version: data.avatar_version,
			profile_version: data.profile_version
		};
		const updatedFriend = {
			friend_id: data.friend_id,
			accepted: true,
			friend_version: data.friend_version,
			user: updatedUser
		};
		friendStore.updateFriend(updatedFriend);
		userStore.updateUser(updatedUser);
	}

	function handleFriendRequestRejectedEvent(data: any) {
		friendStore.removeFriendFromList(data.friend_id);
		friendStore.removeFriendFromStorage(data.friend_id);
	}

	function handleFriendRequestCanceledEvent(data: any) {
		friendStore.removeFriendFromList(data.friend_id);
		friendStore.removeFriendFromStorage(data.friend_id);
	}

	function handleFriendRemovedEvent(data: any) {
		friendStore.removeFriendFromList(data.friend_id);
		friendStore.removeFriendFromStorage(data.friend_id);
	}

	function handleClickOutside(event: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(event.target as Node)) {
			showProfileDropdown = false;
		}
	}

	onMount(() => {
		const isAuthPage = page.url.pathname.startsWith('/auth/');
		if (!isAuthPage) {
			if (authStore.isValidationNeeded()) {
				authStore.validateToken();
			} else {
				authStore.authorized();
			}
		}

		document.addEventListener('click', handleClickOutside);

		const unsubscribeAuth = authStore.subscribe((state) => {
			if (state.isAuthenticated && state.user) {
				userId = state.user.id;
				if (userId) {
					socket = connectSocket(userId);
					joinRoom(userId);
					onMessageEvent(handleMessageEvent);
					onChatAddedEvent(handleMessageChatAddedEvent);
					onUsernameUpdatedEvent(handleUsernameUpdatedEvent);
					onFriendRequestReceivedEvent(handleFriendRequestReceivedEvent);
					onAvatarUpdatedEvent(handleAvatarUpdatedEvent);
					onFriendRequestAcceptedEvent(handleFriendRequestAcceptedEvent);
					onFriendRequestRejectedEvent(handleFriendRequestRejectedEvent);
					onFriendRequestCanceledEvent(handleFriendRequestCanceledEvent);
					onFriendRemovedEvent(handleFriendRemovedEvent);
				}
				if (state.accessToken) {
					getUserDetails(state.accessToken);
				}
			} else {
				if (socket) {
					if (userId != null) {
						leaveRoom(userId);
						disconnectSocket();
					}
					socket = null;
				}
			}
		});

		onDestroy(() => {
			unsubscribeAuth();
			if (socket) {
				if (userId != null) {
					leaveRoom(userId);
					disconnectSocket();
				}
			}
			offMessageEvent();
			offChatAddedEvent();
			offUsernameUpdatedEvent();
			offFriendRequestReceivedEvent();
			offAvatarUpdatedEvent();
			offFriendRequestAcceptedEvent();
			offFriendRequestRejectedEvent();
			offFriendRequestCanceledEvent();
			offFriendRemovedEvent();
			document.removeEventListener('click', handleClickOutside);
		});
	});

	function toggleHome() {
		if (!page.url.pathname.startsWith('/world')) {
			window.location.href = '/world';
		}
	}

	function toggleChat() {
		showChatModal = !showChatModal;
	}

	function toggleFriend() {
		showFriendModal = !showFriendModal;
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="layout-container">
	{#if $authStore.isAuthenticated && !$authStore.loading}
		<nav class="top-nav">
			<div class="nav-left">
				<button class="nav-title-btn" onclick={() => toggleHome()}>
					<h1>Age of Gold</h1>
				</button>
			</div>
			<div class="nav-center">
				<button class="nav-btn" onclick={() => toggleFriend()}>🫂 Friends</button>
				<button class="nav-btn" onclick={() => toggleChat()}>💬 Chat</button>
			</div>
			<div class="nav-right">
				<button class="notification-btn">🔔</button>
				<div class="profile-dropdown-container" bind:this={dropdownRef}>
					<button
						class="profile-btn"
						onclick={(e) => {
							e.stopPropagation();
							toggleProfileDropdown();
						}}
					>
						{#if $userAvatar}
							<img src={$userAvatar} alt="User Avatar" class="profile-avatar" />
						{:else}
							<div
								class="profile-avatar default-avatar"
								style="background-color: {getRandomColor($userDetail.username)}"
							>
								{getInitial($userDetail.username)}
							</div>
						{/if}
						<span class="dropdown-arrow">▼</span>
					</button>
					{#if showProfileDropdown}
						<div class="profile-dropdown">
							<button
								class="dropdown-item"
								onclick={() => {
									goto('/profile');
									showProfileDropdown = false;
								}}>Profile</button
							>
							<button
								class="dropdown-item"
								onclick={() => {
									authStore.logout();
									showProfileDropdown = false;
								}}>Logout</button
							>
						</div>
					{/if}
				</div>
			</div>
		</nav>
	{:else}
		<nav class="top-nav placeholder-nav">
			<div class="nav-left">
				<h1>Age of Gold</h1>
			</div>
			<div class="nav-center"></div>
			<div class="nav-right"></div>
		</nav>
	{/if}

	{#if showFriendModal}
		<FriendView onClose={() => (showFriendModal = false)} {getRandomColor} {getInitial} />
	{/if}
	{#if showChatModal}
		<ChatView onClose={() => (showChatModal = false)} />
	{/if}

	{@render children?.()}
</div>

<SvelteToast {options} />

<style>
	.layout-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.top-nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: #0b9476;
		color: white;
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 99;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.nav-left {
		display: flex;
		align-items: center;
	}

	.nav-left h1 {
		margin: 0;
		color: white;
		font-size: 1.5rem;
	}

	.nav-center {
		display: flex;
		gap: 0.5rem;
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.profile-btn {
		background: transparent;
		color: white;
		border: none;
		padding: 0.5rem;
		font-size: 1.2rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		position: relative;
	}

	.profile-avatar {
		width: 32px;
		height: 32px;
		object-fit: cover;
	}

	.default-avatar {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-size: 0.8rem;
		font-weight: bold;
	}

	.dropdown-arrow {
		font-size: 0.7rem;
	}

	.profile-dropdown {
		position: absolute;
		right: 1rem;
		top: 4rem;
		background: white;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		overflow: hidden;
		z-index: 1001;
		width: 120px;
	}

	.profile-dropdown-container {
		position: relative;
	}

	.dropdown-item {
		width: 100%;
		padding: 0.75rem;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		color: #34495e;
		font-size: 0.9rem;
	}

	.dropdown-item:hover {
		background: #f0f0f0;
	}

	.notification-btn {
		background: transparent;
		color: white;
		border: none;
		padding: 0.5rem;
		border-radius: 50%;
		font-size: 1.2rem;
		cursor: pointer;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.notification-btn:hover {
		background: #095c39;
	}

	.nav-btn {
		background: #048162;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.nav-btn:hover {
		background: #095c39;
	}
	.placeholder-nav {
		background: #979797;
		justify-content: flex-start;
	}
	.nav-title-btn {
		background: transparent;
		color: white;
		border: none;
		padding: 0;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.nav-title-btn h1 {
		margin: 0;
		color: white;
		font-size: 1.5rem;
	}
</style>
