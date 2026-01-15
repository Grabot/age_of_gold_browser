<script lang="ts">
	import { groupStore } from '../../../stores/groupStore';
	import { errorToast, successToast } from '../../../utils/toast';
	import type { Group } from '../../../types/groups';
	import {
		authStore,
		accessTokenValue,
		userAvatar,
		retrieveMissingUsers
	} from '../../../stores/authStore';
	import { get } from 'svelte/store';
	import { friendStore } from '../../../stores/friendStore';
	import { searchFriend } from '$lib/api/friendApi';
	import { userStore } from '../../../stores/userStore';
	import { avatarStore } from '../../../stores/avatarStore';
	import { socketEventStore } from '../../../stores/socketEventStore';
	import type { User } from '../../../types/user';
	import { handleGetAvatar, handleGetAvatarVersion } from '../../../services/settingsService';
	import { onMount, onDestroy } from 'svelte';

	interface FriendSearchResult {
		id: number;
		username: string;
	}

	interface SearchResultArray {
		[key: number]: FriendSearchResult;
	}

	export let group: Group;
	export let onClose: () => void;
	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

	let currentUserId: number | null = null;
	let isCurrentUserAdmin = false;
	let showAddMemberModal = false;
	let showEditGroupModal = false;
	let showMuteOptions = false;
	let muteDurationHours: number | null = null;

	// Form fields for editing group
	let editGroupName: string = '';
	let editGroupDescription: string = '';
	let editGroupColour: string = '';

	// Form fields for adding member
	let newMemberUsername: string = '';
	let searchResults: Array<{ user_id: number; username: string }> = [];
	let isSearching = false;
	let filteredFriends: Array<{
		user_id: number;
		username: string;
		avatar?: string;
		avatar_version?: number;
	}> = [];
	let group_members: Array<{ user_id: number; username: string; avatar: string | null }> = [];
	let isDoneRetrievingGroupMembers = false;

	// TODO: Also used in FriendView.svelte, move to a shared file?
	async function updateUserAvatar(user: User) {
		const accessToken = $accessTokenValue;
		if (accessToken && user) {
			const avatarResponse = await handleGetAvatar(accessToken, user.id, false);
			if (avatarResponse.success && avatarResponse.avatar) {
				user.avatar = avatarResponse.avatar;
				avatarStore.updateAvatar(user.id, avatarResponse.avatar);
				const avatarVersionResponse = await handleGetAvatarVersion(accessToken, user.id);
				if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
					user.avatar_version = avatarVersionResponse.avatarVersion;
				}
				userStore.updateUser(user);
				avatarStore.setShouldUpdateAvatarForUser(user.id, false);
			} else {
				errorToast('Failed to fetch avatar');
			}
		}
	}

	function getGroupMembers() {
		if (isDoneRetrievingGroupMembers) {
			console.log('Already retrieved group members, skipping...');
			return;
		}
		// Reset group_members when group.user_ids changes
		group_members = [];

		// Add current user if not already in the list
		const authState = get(authStore);
		let myUserId: number | null = null;
		if (authState.isAuthenticated && authState.user) {
			myUserId = authState.user.id;
			const myUsername = authState.user.username;
			const myUserAvatar = get(userAvatar);
			group_members.push({
				user_id: myUserId,
				username: myUsername,
				avatar: myUserAvatar
			});
		}
		let userIdsToRetrieve = [];
		let avatarIdsToRetrieve = [];
		for (const userId of group.user_ids) {
			if (myUserId == userId) {
				// already added
				continue;
			}
			const groupUser = userStore.getUser(userId);
			const avatarUser = avatarStore.getAvatar(userId);
			if (groupUser && avatarUser) {
				group_members.push({
					user_id: groupUser.id,
					username: groupUser.username,
					avatar: avatarUser
				});
			} else if (groupUser && !avatarUser) {
				avatarIdsToRetrieve.push(userId);
				group_members.push({
					user_id: groupUser.id,
					username: groupUser.username,
					avatar: null
				});
			} else if (!groupUser && avatarUser) {
				userIdsToRetrieve.push(userId);
				group_members.push({
					user_id: userId,
					username: 'User',
					avatar: avatarUser
				});
			} else {
				userIdsToRetrieve.push(userId);
				avatarIdsToRetrieve.push(userId);
				group_members.push({
					user_id: userId,
					username: 'User',
					avatar: null
				});
			}
		}
		console.log('missing users', userIdsToRetrieve);
		console.log('missing avatars', avatarIdsToRetrieve);

		const accessToken = get(accessTokenValue);
		// TODO: Add a second or third call check to avoid loops.
		if (userIdsToRetrieve.length > 0 && accessToken) {
			retrieveMissingUsers(userIdsToRetrieve, accessToken).then(async (_) => {
				console.log('users retrieved');
				// loop over avatarIdsToRetrieve
				for (const userId of avatarIdsToRetrieve) {
					const user = userStore.getUser(userId);
					if (user) {
						await updateUserAvatar(user);
					} else {
						// TODO: Do we do a fallback? Probably not possible
					}
				}
				// All uses and avatars retrieved, run the getGroupMembers again
				console.log('All uses and avatars retrieved, run the getGroupMembers again');
				getGroupMembers();
				isDoneRetrievingGroupMembers = true;
			});
		}
	}

	$: {
		getGroupMembers();
	}

	// Initialize when component mounts
	$: {
		const authState = get(authStore);
		currentUserId = authState.user?.id || null;
		isCurrentUserAdmin = currentUserId ? group.admin_ids.includes(currentUserId) : false;

		// Initialize edit form fields
		editGroupName = group.group_name || '';
		editGroupDescription = group.group_description || '';
		editGroupColour = group.group_colour || '#0b9476';

		// Filter friends based on search query
		filterFriends();
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	async function handleLeaveGroup() {
		try {
			const success = await groupStore.leaveGroup(group.group_id);
			if (success) {
				// TODO: Check which groupMember is a friend and who is not.
				// Those who are not can be removed from the stored data (userStore, friendStore and avatarStore)
				onClose();
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleRemoveMember(userId: number) {
		try {
			const success = await groupStore.removeGroupMember(group.group_id, userId);
			if (success) {
				successToast('Member removed successfully');
				// Refresh the group data
				const updatedGroup = groupStore.getStoredGroup(group.group_id);
				if (updatedGroup) {
					group = updatedGroup;
				}
				// TODO: Check if the member was a friend, if not remove it from the stored data (userStore, friendStore and avatarStore)
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handlePromoteAdmin(userId: number, isAdmin: boolean) {
		try {
			const success = await groupStore.promoteAdmin(group.group_id, userId, isAdmin);
			if (success) {
				successToast(isAdmin ? 'User promoted to admin' : 'User demoted from admin');
				// Refresh the group data
				const updatedGroup = groupStore.getStoredGroup(group.group_id);
				if (updatedGroup) {
					group = updatedGroup;
				}
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleMuteGroup() {
		try {
			const mute = !group.mute;
			const success = await groupStore.muteGroup(group.group_id, mute, muteDurationHours);
			if (success) {
				successToast(mute ? 'Group muted' : 'Group unmuted');
				showMuteOptions = false;
				// Refresh the group data
				const updatedGroup = groupStore.getStoredGroup(group.group_id);
				if (updatedGroup) {
					group = updatedGroup;
				}
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleUpdateGroup() {
		try {
			const success = await groupStore.updateGroupDetails(
				group.group_id,
				editGroupName,
				editGroupDescription,
				editGroupColour
			);
			if (success) {
				successToast('Group updated successfully');
				showEditGroupModal = false;
				// Refresh the group data
				const updatedGroup = groupStore.getStoredGroup(group.group_id);
				if (updatedGroup) {
					group = updatedGroup;
				}
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function filterFriends() {
		const friends = get(friendStore).friends;
		const currentUserId = get(authStore).user?.id || null;

		// Filter friends that are already in the group and are accepted
		let availableFriends = friends.filter(
			(friend) =>
				friend.accepted === true &&
				friend.user &&
				!group.user_ids.includes(friend.friend_id) &&
				friend.friend_id !== currentUserId
		);

		// If there's a search query, filter by username
		if (newMemberUsername.trim()) {
			availableFriends = availableFriends.filter((friend) =>
				friend.user?.username.toLowerCase().includes(newMemberUsername.toLowerCase())
			);
		}

		// Map to include avatar information
		filteredFriends = availableFriends.map((friend) => ({
			user_id: friend.friend_id,
			username: friend.user?.username || 'Unknown User',
			avatar: friend.user?.avatar,
			avatar_version: friend.user?.avatar_version
		}));
	}

	async function searchUsers() {
		if (!newMemberUsername.trim()) {
			searchResults = [];
			return;
		}

		isSearching = true;
		try {
			const accessToken = get(accessTokenValue);
			const response = await searchFriend<FriendSearchResult>(accessToken, newMemberUsername);
			if (response.success && response.data) {
				// Handle both single result and array results
				const data = Array.isArray(response.data) ? response.data : [response.data];
				searchResults = data.map((user) => ({
					user_id: user.id,
					username: user.username
				}));
			} else {
				searchResults = [];
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	async function handleAddMember(userId: number) {
		try {
			const success = await groupStore.addGroupMember(group.group_id, userId);
			if (success) {
				successToast('Member added successfully');
				showAddMemberModal = false;
				newMemberUsername = '';
				filteredFriends = [];
				// Refresh the group data
				const updatedGroup = groupStore.getStoredGroup(group.group_id);
				if (updatedGroup) {
					group = updatedGroup;
				}
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}
	let socketEventUnsubscribe: (() => void) | null = null;

	// Set up socket event listener when component mounts
	onMount(() => {
		socketEventUnsubscribe = socketEventStore.subscribe((events) => {
			events.forEach((_) => {
				const newGroup = groupStore.getStoredGroup(group.group_id);
				if (newGroup) {
					console.log('Group updated');
					group = newGroup;
				}
				isDoneRetrievingGroupMembers = false;
				getGroupMembers();
			});
		});
	});

	// Clean up event listener when component unmounts
	onDestroy(() => {
		if (socketEventUnsubscribe) {
			socketEventUnsubscribe();
		}
	});
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') onClose();
		if (e.key === 'Enter' || e.key === ' ') {
			handleOverlayClick(e as unknown as MouseEvent);
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Group Details"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Group Details</h2>
			<button class="close-btn" on:click={onClose}>x</button>
		</div>

		<div class="modal-body">
			<div class="group-details">
				<div class="group-header">
					<div class="group-avatar-container">
						{#if group.avatar}
							<img class="group-avatar" src={group.avatar} alt={group.group_name} />
						{:else}
							<div
								class="group-avatar"
								style="background-color: {group.group_colour || getRandomColor('Group')}"
							>
								{getInitial(group.group_name || 'G')}
							</div>
						{/if}
					</div>
					<div class="group-info">
						<h4>{group.group_name}</h4>
						<p class="group-description">{group.group_description || 'No description'}</p>
					</div>
				</div>

				<div class="group-meta">
					<p><strong>Members:</strong> {group.user_ids.length}</p>
					<p><strong>Admins:</strong> {group.admin_ids.length}</p>
					<p><strong>Status:</strong> {group.mute ? 'Muted' : 'Active'}</p>
				</div>

				<div class="group-actions">
					{#if isCurrentUserAdmin}
						<button class="action-btn" on:click={() => (showAddMemberModal = true)}>
							Add Member
						</button>
						<button class="action-btn" on:click={() => (showEditGroupModal = true)}>
							Edit Group
						</button>
					{/if}
					<button class="action-btn" on:click={() => (showMuteOptions = !showMuteOptions)}>
						{group.mute ? 'Unmute Group' : 'Mute Group'}
					</button>
				</div>

				{#if showMuteOptions}
					<div class="mute-options">
						<h4>Mute Options</h4>
						<div class="mute-duration">
							<label>
								<input
									type="radio"
									name="muteDuration"
									bind:group={muteDurationHours}
									value={null}
								/>
								Mute Indefinitely
							</label>
							<label>
								<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={1} />
								Mute for 1 hour
							</label>
							<label>
								<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={4} />
								Mute for 4 hours
							</label>
							<label>
								<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={8} />
								Mute for 8 hours
							</label>
						</div>
						<button class="confirm-btn" on:click={handleMuteGroup}> Confirm Mute </button>
					</div>
				{/if}

				<div class="group-members">
					<h3>Members</h3>
					<ul>
						{#each group_members as group_member (group_member.user_id)}
							<li class="member-item">
								<!-- Avatar -->
								<div class="member-avatar-container">
									{#if group_member.avatar}
										<img
											class="member-avatar"
											src={group_member.avatar}
											alt={group_member.username}
										/>
									{:else}
										<div
											class="member-avatar placeholder"
											style="background-color: {getRandomColor(group_member.username)}"
										>
											{getInitial(group_member.username)}
										</div>
									{/if}
								</div>

								<!-- Username (always centered) -->
								<div class="member-username-container">
									<span class="member-username">
										{group_member.username}
									</span>
								</div>

								<!-- Actions or "You" tag (fixed width) -->
								<div class="member-actions-container">
									{#if group_member.user_id === currentUserId}
										<span class="you-badge">You</span>
									{:else if isCurrentUserAdmin && group_member.user_id !== currentUserId}
										{#if group.admin_ids.includes(group_member.user_id)}
											<button
												class="demote-btn"
												on:click={() => handlePromoteAdmin(group_member.user_id, false)}
											>
												Demote
											</button>
										{:else}
											<button
												class="promote-btn"
												on:click={() => handlePromoteAdmin(group_member.user_id, true)}
											>
												Promote
											</button>
										{/if}
										<button
											class="remove-btn"
											on:click={() => handleRemoveMember(group_member.user_id)}
										>
											Remove
										</button>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>

		{#if showAddMemberModal}
			<div
				class="add-member-modal"
				on:click|stopPropagation={(e) => {
					if (e.target === e.currentTarget) {
						showAddMemberModal = false;
					}
				}}
				on:keydown={(e) => {
					if (e.key === 'Escape') {
						showAddMemberModal = false;
					}
				}}
				role="dialog"
				aria-modal="true"
				aria-label="Add Member"
				tabindex="0"
			>
				<div class="add-member-content">
					<div class="modal-header">
						<h3>Add Member</h3>
						<button class="close-btn" on:click={() => (showAddMemberModal = false)}>×</button>
					</div>
					<div class="search-section">
						<div class="search-input-container">
							<input
								type="text"
								placeholder="Search your friends..."
								bind:value={newMemberUsername}
								on:input={() => filterFriends()}
							/>
							{#if newMemberUsername}
								<button
									class="clear-search-btn"
									on:click={() => {
										newMemberUsername = '';
										filterFriends();
									}}
								>
									×
								</button>
							{/if}
						</div>
						{#if isSearching}
							<p>Searching...</p>
						{/if}
					</div>

					{#if filteredFriends.length > 0}
						<div class="search-results">
							<h4>Your Friends</h4>
							<ul>
								{#each filteredFriends as friend (friend.user_id)}
									<li class="friend-item">
										<div class="friend-avatar-container">
											{#if friend.avatar}
												<img class="friend-avatar" src={friend.avatar} alt={friend.username} />
											{:else}
												<div
													class="friend-avatar placeholder"
													style="background-color: {getRandomColor(friend.username)}"
												>
													{getInitial(friend.username)}
												</div>
											{/if}
										</div>
										<div class="friend-info">
											<span class="friend-username">{friend.username}</span>
										</div>
										<button class="add-btn" on:click={() => handleAddMember(friend.user_id)}>
											Add
										</button>
									</li>
								{/each}
							</ul>
						</div>
					{:else if newMemberUsername}
						<p class="no-results">No friends found matching "{newMemberUsername}"</p>
					{:else}
						<p class="no-results">You don't have any friends to add to this group.</p>
					{/if}

					<div class="modal-footer">
						<button class="cancel-btn" on:click={() => (showAddMemberModal = false)}>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		{#if showEditGroupModal}
			<div
				class="edit-group-modal"
				on:click|stopPropagation={(e) => {
					if (e.target === e.currentTarget) {
						showEditGroupModal = false;
					}
				}}
				on:keydown={(e) => {
					if (e.key === 'Escape') {
						showEditGroupModal = false;
					}
				}}
				role="dialog"
				aria-modal="true"
				aria-label="Edit Group"
				tabindex="0"
			>
				<div class="edit-group-content">
					<div class="modal-header">
						<h3>Edit Group</h3>
						<button class="close-btn" on:click={() => (showEditGroupModal = false)}>×</button>
					</div>
					<form on:submit|preventDefault={handleUpdateGroup}>
						<div class="form-group">
							<label for="editGroupName">Group Name</label>
							<input id="editGroupName" type="text" bind:value={editGroupName} required />
						</div>

						<div class="form-group">
							<label for="editGroupDescription">Description</label>
							<textarea id="editGroupDescription" bind:value={editGroupDescription}></textarea>
						</div>

						<div class="form-group">
							<label for="editGroupColour">Group Color</label>
							<input id="editGroupColour" type="color" bind:value={editGroupColour} />
						</div>

						<div class="form-actions">
							<button type="submit" class="save-btn">Save Changes</button>
							<button type="button" class="cancel-btn" on:click={() => (showEditGroupModal = false)}
								>Cancel</button
							>
						</div>
					</form>
				</div>
			</div>
		{/if}

		<div class="modal-footer">
			<button class="leave-btn" on:click={handleLeaveGroup}>Leave Group</button>
			<button class="close-btn" on:click={onClose}>Close</button>
		</div>
	</div>
</div>

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1001;
	}

	.modal-content {
		background: white;
		width: 80%;
		height: 70%;
		max-width: 800px;
		max-height: 600px;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.modal-header {
		background: #0b9476;
		color: white;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.modal-body {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.group-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group-header {
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	.group-avatar-container {
		width: 60px;
		height: 60px;
		flex-shrink: 0;
		margin-right: 1rem;
	}

	.group-avatar {
		width: 60px;
		height: 60px;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.group-avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 1.5rem;
		width: 60px;
		height: 60px;
	}

	.group-info h4 {
		margin: 0;
		color: #333;
	}

	.group-description {
		margin: 0.5rem 0 0 0;
		color: #666;
		font-size: 0.9rem;
	}

	.group-meta {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		font-size: 0.9rem;
		color: #666;
	}

	.group-actions {
		display: flex;
		gap: 0.5rem;
		margin: 1rem 0;
		flex-wrap: wrap;
	}

	.action-btn {
		padding: 0.5rem 1rem;
		background-color: #0b9476;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.action-btn:hover {
		background-color: #087f62;
	}

	.mute-options {
		background: #f5f5f5;
		padding: 1rem;
		border-radius: 8px;
		margin: 1rem 0;
	}

	.mute-duration {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.confirm-btn {
		padding: 0.5rem 1rem;
		background-color: #e74c3c;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.group-members {
		margin-top: 1rem;
	}

	.group-members h3 {
		margin-bottom: 1rem;
		color: #333;
	}

	.member-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
	}

	.member-actions {
		display: flex;
		gap: 0.5rem;
	}

	.promote-btn {
		padding: 0.3rem 0.6rem;
		background-color: #2ecc71;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.demote-btn {
		padding: 0.3rem 0.6rem;
		background-color: #f39c12;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.remove-btn {
		padding: 0.3rem 0.6rem;
		background-color: #e74c3c;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.admin-badge {
		padding: 0.2rem 0.5rem;
		background-color: #3498db;
		color: white;
		border-radius: 4px;
		font-size: 0.7rem;
		margin-left: 0.5rem;
	}

	.add-member-modal,
	.edit-group-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1002;
	}

	.add-member-content,
	.edit-group-content {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		width: 80%;
		max-width: 500px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		position: relative;
	}

	.search-section {
		margin: 1rem 0;
	}

	.search-section {
		position: relative;
		margin: 1rem 0;
	}

	.search-input-container {
		position: relative;
		width: 100%;
	}

	.search-section input {
		width: 100%;
		padding: 0.5rem 2.5rem 0.5rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.clear-search-btn {
		position: absolute;
		right: 0.5rem;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: #999;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.clear-search-btn:hover {
		color: #666;
	}

	.search-results {
		margin: 1rem 0;
		max-height: 400px;
		overflow-y: auto;
	}

	.search-results h4 {
		margin-bottom: 0.75rem;
		color: #333;
		font-size: 1rem;
	}

	.search-results ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.search-results ul {
		list-style: none;
		padding: 0;
	}

	.search-results li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
	}

	.friend-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.friend-avatar-container {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
	}

	.friend-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.friend-avatar.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		background-color: #ccc;
	}

	.friend-info {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.friend-username {
		font-weight: 500;
		color: #333;
	}

	.add-btn {
		padding: 0.3rem 0.6rem;
		background-color: #2ecc71;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		background-color: #95a5a6;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-top: 1rem;
	}

	.add-member-content .modal-header {
		background: #0b9476;
		color: white;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 12px 12px 0 0;
		margin: -2rem -2rem 1rem -2rem;
	}

	.add-member-content .modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.add-member-content .close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.add-member-content .modal-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.5rem;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.form-group input[type='text'],
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.form-group textarea {
		min-height: 100px;
		resize: vertical;
	}

	.form-group input[type='color'] {
		width: 50px;
		height: 50px;
		padding: 0;
		border: 1px solid #ddd;
		border-radius: 4px;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.save-btn {
		padding: 0.5rem 1rem;
		background-color: #2ecc71;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem;
		border-top: 1px solid #eee;
	}

	.leave-btn {
		padding: 0.5rem 1rem;
		background-color: #e74c3c;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.leave-btn:hover {
		background-color: #c0392b;
	}

	.close-btn {
		padding: 0.5rem 1rem;
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.close-btn:hover {
		background-color: #e0e0e0;
	}
	.member-avatar-container {
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
		min-width: 2.5rem;
		min-height: 2.5rem;
		overflow: hidden;
		background-color: #f0f0f0;
	}

	.member-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	.member-avatar.placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 1rem;
		background-color: #ccc;
	}
	.you-badge {
		padding: 0.2rem 0.5rem;
		background-color: #3498db;
		color: white;
		border-radius: 4px;
		font-size: 0.7rem;
		margin-left: 0.5rem;
	}
	.member-item {
		display: flex;
		align-items: center;
		padding: 0.5rem;
		border-bottom: 1px solid #eee;
		width: 100%;
	}

	.member-avatar-container {
		width: 2.5rem;
		height: 2.5rem;
		flex-shrink: 0;
		margin-right: 1rem;
	}

	.member-username-container {
		flex: 1;
		text-align: center; /* Center the username */
	}

	.member-actions-container {
		width: 120px; /* Fixed width for alignment */
		flex-shrink: 0;
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end; /* Align actions to the right */
	}

	.you-badge {
		padding: 0.2rem 0.5rem;
		background-color: #3498db;
		color: white;
		border-radius: 4px;
		font-size: 0.7rem;
	}
</style>
