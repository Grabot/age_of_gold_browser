<script lang="ts">
	import { SvelteToast } from '@zerodevx/svelte-toast';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount, onDestroy } from 'svelte';
	import { initializeTextColour } from '$lib/utils/colourUtils';
	import { authStore, shouldUpdateAvatar, userAvatar, userDetail } from '$lib/stores/authStore';
	import { friendStore } from '$lib/stores/friendStore';
	import { avatarStore } from '$lib/stores/avatarStore';
	import {
		connectSocket,
		disconnectSocket,
		joinRoom,
		leaveRoom,
		onMessageEvent,
		offMessageEvent,
		onUsernameUpdatedEvent,
		onFriendRequestReceivedEvent,
		offUsernameUpdatedEvent,
		onAvatarUpdatedEvent,
		onFriendRequestAcceptedEvent,
		onFriendRequestRejectedEvent,
		onFriendRequestCanceledEvent,
		onFriendRemovedEvent,
		offFriendRequestReceivedEvent,
		offAvatarUpdatedEvent,
		offFriendRequestAcceptedEvent,
		offFriendRequestRejectedEvent,
		offFriendRequestCanceledEvent,
		offFriendRemovedEvent,
		onGroupCreatedEvent,
		onGroupMemberLeftEvent,
		offGroupCreatedEvent,
		offGroupMemberLeftEvent,
		onGroupAdminChangedEvent,
		type GroupAdminChangedEventData,
		onGroupUpdateEvent,
		type GroupUpdateEventData,
		onGroupMemberRemovedEvent,
		offGroupUpdateEvent,
		offGroupMemberRemovedEvent,
		type GroupMemberRemovedEventData,
		onGroupMemberAddedEvent,
		type GroupMemberAddedEventData,
		onGroupAvatarChangedEvent,
		type GroupAvatarChangedEventData,
		offGroupAvatarChangedEvent,
		onColourUpdatedEvent,

		offMessageReceivedEvent,

		onMessageReceivedEvent,

		type MessageData



	} from '$lib/socket';
	import { handleGetAvatar } from '$lib/services/settingsService';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { Socket } from 'socket.io-client';
	import { get } from 'svelte/store';
	import { errorToast, successToast } from '$lib/utils/toast';
	import ChatView from '../components/chat/ChatView.svelte';
	import SocialView from '../components/chat/SocialView.svelte';
	import AddFriend from '../components/chat/friends/AddFriend.svelte';
	import CreateGroupModal from '../components/chat/groups/CreateGroupModal.svelte';
	import { userStore } from '$lib/stores/userStore';
	import { groupStore } from '$lib/stores/groupStore';
	import type { Group } from '$lib/types/groups';
	import { socketEventStore } from '$lib/stores/socketEventStore';
	import { getRandomColour } from '$lib/utils/groupUtils';
	import { handleIncomingMessage } from '$lib/utils/messageUtils';

	let { children } = $props();
	const options = {};

	let socket: Socket | null = null;
	let userId: number | null = null;
	let hasFetchedAvatar = false;
	let showProfileDropdown = $state(false);
	let showChatModal = $state(false);
	let showSocialModal = $state(false);
	let showAddFriendModal = $state(false);
	let showCreateGroupModal = $state(false);
	let searchQuery = $state('');
	let searchResult = $state<{ id: number; username: string; colour: string } | null>(null);
	let searchResultAvatar = $state<string | null>(null);
	let searched = $state(false);
	let lastSearchedQuery = $state<string | null>(null);
	let isLoading = $state(false);
	let dropdownRef: HTMLDivElement | null = $state(null);

	function handleAddFriendModalClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			showAddFriendModal = false;
		}
	}

	function toggleProfileDropdown() {
		showProfileDropdown = !showProfileDropdown;
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

	function getInitial(username: string): string {
		return username.charAt(0).toUpperCase();
	}

	// Initialize text color based on primary color brightness (client-side only)
	onMount(() => {
		initializeTextColour();
	});

	function handleMessageEvent(message: string) {
		console.log('socket message:', message);
	}

	function handleUsernameUpdatedEvent(data: any) {
		if ($authStore.user) {
			if ($authStore.user.id === data.user_id) {
				// I changed my username, the details are already set
				return;
			}
		}
		friendStore.updateFriendUsername(data.user_id, data.new_username, data.profile_version);
	}

	function handleColourUpdatedEvent(data: any) {
		if ($authStore.user) {
			if ($authStore.user.id === data.user_id) {
				// I changed my username, the details are already set
				return;
			}
		}
		friendStore.updateFriendColour(data.user_id, data.new_colour, data.profile_version);
	}

	function handleFriendRequestReceivedEvent(data: any) {
		friendStore.addFriendRequest(data);
	}

	async function handleAvatarUpdatedEvent(data: any) {
		await avatarStore.updateAvatarVersion(data.user_id);
	}

	function handleFriendRequestAcceptedEvent(data: any) {
		const updatedUser = {
			id: data.friend_id,
			username: data.username,
			avatar_version: data.avatar_version,
			profile_version: data.profile_version,
			colour: data.colour
		};
		const updatedFriend = {
			friend_id: data.friend_id,
			accepted: true,
			friend_version: data.friend_version,
			message_version: 0,
			chat_id: data.chat_id,
			user: updatedUser,
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

	function handleGroupCreatedEvent(data: any) {
		successToast(`New group created: ${data.name}`);
		const chatId = data.chat_id;
		const chat = { 
			id: chatId,
			private: data.private
		};
		const group: Group = {
			chat_id: data.chat_id,
			unread_messages: 0,
			mute: false,
			mute_timestamp: null,
			group_version: 0,
			message_version: 0,
			avatar_version: 0,
			last_message_read_id: data.last_message_read_id,
			user_ids: data.user_ids,
			admin_ids: data.admin_ids,
			name: data.name,
			description: data.description,
			colour: data.colour,
			current_message_id: data.current_message_id,
		};
		joinGroup(group.chat_id);
		setTimeout(() => {
			groupStore.updateGroup(group);
		}, 1000);
	}

	async function handleGroupMemberLeftEvent(data: any) {
		const group = await groupStore.getGroup(data.chat_id);
		if (!group) {
			return false;
		}

		const updatedUserIds = group.user_ids.filter((id) => id !== data.user_id);

		const updatedGroup: Group = {
			...group,
			user_ids: updatedUserIds
		};
		updatedGroup.group_version += 1;
		groupStore.updateGroup(updatedGroup);
		socketEventStore.dispatch({
			type: 'group_member_left',
			data: data
		});
	}

	async function handleGroupAdminChangedEvent(data: GroupAdminChangedEventData) {
		const group = await groupStore.getGroup(data.chat_id);
		if (!group) {
			throw new Error(`Group not found in storage.`);
		}

		const updatedAdminIds = data.is_admin
			? [...group.admin_ids, data.user_id]
			: group.admin_ids.filter((id) => id !== data.user_id);
		const updatedGroup: Group = {
			...group,
			admin_ids: updatedAdminIds
		};
		updatedGroup.group_version += 1;
		groupStore.updateGroup(updatedGroup);
		socketEventStore.dispatch({
			type: 'group_admin_changed',
			data: data
		});
	}

	async function handleGroupUpdateEvent(data: GroupUpdateEventData) {
		const group = await groupStore.getGroup(data.chat_id);
		if (!group) {
			throw new Error(`Group not found in storage.`);
		}

		let updatedGroup: Group = group;

		if (data.name) {
			updatedGroup = {
				...updatedGroup,
				name: data.name
			};
		}
		if (data.description) {
			updatedGroup = {
				...updatedGroup,
				description: data.description
			};
		}
		if (data.colour) {
			updatedGroup = {
				...updatedGroup,
				colour: data.colour
			};
		}
		updatedGroup.group_version += 1;
		groupStore.updateGroup(updatedGroup);
		socketEventStore.dispatch({
			type: 'group_updated',
			data: data
		});
	}

	async function handleGroupMemberRemovedEvent(data: GroupMemberRemovedEventData) {
		const group = await groupStore.getGroup(data.chat_id);
		if (!group) {
			throw new Error(`Group not found in storage.`);
		}
		if ($authStore.user) {
			if ($authStore.user.id === data.user_id) {
				errorToast('You were removed from a group');
				groupStore.removeGroup(data.chat_id);
				leaveGroup(data.chat_id);
				const friendIds: number[] = $friendStore.friends.map((friend) => friend.friend_id);

				for (const userId of group.user_ids) {
					if (!friendIds.includes(userId)) {
						userStore.removeUserFromStorage(userId);
						avatarStore.removeAvatarFromStorage(userId);
					}
				}
				return;
			}
		}
		const updatedUserIds = group.user_ids.filter((id) => id !== data.user_id);
		const updatedAdminIds = group.admin_ids.filter((id) => id !== data.user_id);
		const updatedGroup: Group = {
			...group,
			user_ids: updatedUserIds,
			admin_ids: updatedAdminIds
		};
		groupStore.updateGroup(updatedGroup);
		socketEventStore.dispatch({
			type: 'group_member_removed',
			data: data
		});
	}

	async function handleGroupMemberAddedEvent(data: GroupMemberAddedEventData) {
		const group = await groupStore.getGroup(data.chat_id);
		if (!group) {
			throw new Error(`Group not found in storage.`);
		}

		group.group_version += 1;
		if (group.user_ids.includes(data.user_id)) {
			groupStore.updateGroup(group);
			return;
		}
		const updatedUserIds = [...group.user_ids, data.user_id];
		const updatedGroup: Group = {
			...group,
			user_ids: updatedUserIds
		};
		groupStore.updateGroup(updatedGroup);
		socketEventStore.dispatch({
			type: 'group_member_added',
			data: data
		});
	}

	function handleGroupAvatarChangedEvent(data: GroupAvatarChangedEventData) {
		socketEventStore.dispatch({
			type: 'group_avatar_updated',
			data: data
		});
	}

	function handleOnMessageReceivedEvent(data: MessageData) {
		console.log("Message received");
		console.log(data);
		handleIncomingMessage(data);
		// Dispatch to socket event store for components to handle
		socketEventStore.dispatch({
			type: 'message_received',
			data: data
		});
	}

	export function joinGroup(groupId: number) {
		if (socket) {
			socket.emit('join_group', { chat_id: groupId });
		}
	}

	export function leaveGroup(groupId: number) {
		if (socket) {
			socket.emit('leave_group', { chat_id: groupId });
		}
	}

	function joinAllGroupRooms() {
		const state = get(groupStore);
		state.groups.forEach((group) => {
			joinGroup(group.chat_id);
		});
	}

	function leaveAllGroupRooms() {
		const state = get(groupStore);
		state.groups.forEach((group) => {
			leaveGroup(group.chat_id);
		});
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

					// Set up socket event listeners for reconnection handling
					socket.on('disconnect', () => {
						console.log('Socket disconnected, leaving all rooms');
						leaveAllGroupRooms();
						if (userId !== null) {
							leaveRoom(userId);
						}
						socketOff();
						return;
					});

					socket.on('reconnect', () => {
						leaveAllGroupRooms();
						if (userId !== null) {
							leaveRoom(userId);
						}
						socketOff();
						if (userId !== null) {
							joinRoom(userId);
						}
						joinAllGroupRooms();
						socketOn();
						return;
					});

					joinRoom(userId);
					joinAllGroupRooms();
					socketOn();
				}
				if (state.accessToken) {
					getUserDetails(state.accessToken);
				}
			} else {
				if (socket) {
					leaveAllGroupRooms();
					if (userId !== null) {
						leaveRoom(userId);
					}
					disconnectSocket();
					socket = null;
				}
			}
		});

		onDestroy(() => {
			unsubscribeAuth();
			if (socket) {
				leaveAllGroupRooms();
				if (userId !== null) {
					leaveRoom(userId);
				}
				disconnectSocket();
			}
			socketOff();
			document.removeEventListener('click', handleClickOutside);
		});
	});

	function socketOn() {
		onMessageEvent(handleMessageEvent);
		onUsernameUpdatedEvent(handleUsernameUpdatedEvent);
		onColourUpdatedEvent(handleColourUpdatedEvent);
		onFriendRequestReceivedEvent(handleFriendRequestReceivedEvent);
		onAvatarUpdatedEvent(handleAvatarUpdatedEvent);
		onFriendRequestAcceptedEvent(handleFriendRequestAcceptedEvent);
		onFriendRequestRejectedEvent(handleFriendRequestRejectedEvent);
		onFriendRequestCanceledEvent(handleFriendRequestCanceledEvent);
		onFriendRemovedEvent(handleFriendRemovedEvent);
		onGroupCreatedEvent(handleGroupCreatedEvent);
		onGroupMemberLeftEvent(handleGroupMemberLeftEvent);
		onGroupMemberAddedEvent(handleGroupMemberAddedEvent);
		onGroupAdminChangedEvent(handleGroupAdminChangedEvent);
		onGroupUpdateEvent(handleGroupUpdateEvent);
		onGroupMemberRemovedEvent(handleGroupMemberRemovedEvent);
		onGroupAvatarChangedEvent(handleGroupAvatarChangedEvent);
		onMessageReceivedEvent(handleOnMessageReceivedEvent);
	}
	function socketOff() {
		offMessageEvent();
		offUsernameUpdatedEvent();
		offFriendRequestReceivedEvent();
		offAvatarUpdatedEvent();
		offFriendRequestAcceptedEvent();
		offFriendRequestRejectedEvent();
		offFriendRequestCanceledEvent();
		offFriendRemovedEvent();
		offGroupCreatedEvent();
		offGroupMemberLeftEvent();
		offGroupUpdateEvent();
		offGroupMemberRemovedEvent();
		offGroupAvatarChangedEvent();
		offMessageReceivedEvent();
	}

	function toggleHome() {
		if (!page.url.pathname.startsWith('/world')) {
			window.location.href = '/world';
		}
	}

	function toggleChat() {
		showChatModal = !showChatModal;
	}

	function toggleSocial() {
		showSocialModal = !showSocialModal;
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
				<button class="nav-btn" onclick={() => toggleSocial()}>👥 Socials</button>
				<button class="nav-btn" onclick={() => toggleChat()}>💬 Chat</button>
			</div>
			<div class="nav-right">
				<button class="notification-btn" onclick={() => {}}>🔔</button>
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
								style="background-color: {getRandomColour()}"
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
								}}>Profile</button>
							<button
								class="dropdown-item"
								onclick={() => {
									authStore.logout();
									showProfileDropdown = false;
								}}>Logout</button>
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

    {#if showSocialModal}
        <SocialView
            onClose={() => (showSocialModal = false)}
            onAddFriendClick={() => (showAddFriendModal = true)}
            onCreateGroupClick={() => (showCreateGroupModal = true)}
        />
    {/if}

    {#if showAddFriendModal}
		<div
			class="modal-overlay"
			onclick={handleAddFriendModalClick}
			onkeydown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					handleAddFriendModalClick(e as unknown as MouseEvent);
				}
			}}
			role="button"
			tabindex="0"
			aria-label="Close modal"
		>
			<div class="modal-content-friend">
				<div class="modal-header-friend">
					<h3>Add New Social</h3>
					<button
						class="close-btn"
						onclick={() => (showAddFriendModal = false)}
						aria-label="Close"
					>
						×
					</button>
				</div>
				<AddFriend
					bind:searchQuery
					bind:searchResult
					bind:searchResultAvatar
					bind:searched
					bind:lastSearchedQuery
					bind:isLoading
					onClose={() => (showAddFriendModal = false)}
				/>
			</div>
		</div>
    {/if}

	{#if showCreateGroupModal}
		<CreateGroupModal onClose={() => (showCreateGroupModal = false)} />
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
        background: var(--primary-colour);
		color: var(--text-colour-on-primary);
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
		color: var(--text-colour-on-primary);
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
		color: var(--text-colour-on-primary);
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
		color: var(--text-colour-on-primary);
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
		color: var(--text-colour-on-primary);
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
        background: var(--primary-colour-dark);
    }

    .nav-btn {
        background: var(--primary-colour);
        color: var(--text-colour-on-primary);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.9rem;
    }

    .nav-btn:hover {
        background: var(--primary-colour-dark);
    }
	.placeholder-nav {
		background: #979797;
		justify-content: flex-start;
	}
	.nav-title-btn {
		background: transparent;
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.nav-title-btn h1 {
		margin: 0;
		color: var(--text-colour-on-primary);
		font-size: 1.5rem;
	}

	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content-friend {
		background: white;
		width: 80%;
		max-width: 500px;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		padding: 2rem;
		position: relative;
		max-height: 80vh;
		overflow-y: auto;
	}

	.close-btn {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.close-btn:hover {
		color: #333;
	}

    .modal-header-friend {
        background: var(--primary-colour);
        color: var(--text-colour-on-primary);
        padding: 1rem 1.5rem;
        display: flex;
		justify-content: space-between;
		align-items: center;
		border-top-left-radius: 12px;
		border-top-right-radius: 12px;
		margin: -2rem -2rem 1rem -2rem;
	}

	.modal-header-friend h3 {
		margin: 0;
		font-size: 1.5rem;
	}
</style>
