<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { getRandomColour, getInitial, getTextColorForBackground } from '$lib/utils/groupUtils';
	import { updateUserAvatar } from '$lib/utils/avatarUtils';
	import { authStore, accessTokenValue, userAvatar } from '$lib/stores/authStore';
	import { retrieveMissingUsers } from '$lib/services/dataRetrievalService';
	import { get } from 'svelte/store';
	import { userStore } from '$lib/stores/userStore';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { socketEventStore } from '$lib/stores/socketEventStore';
	import type { Group } from '$lib/types/groups';
	import { handleChangeGroupAvatar, handleGetGroupAvatar } from '$lib/services/settingsService';
	import { onMount, onDestroy } from 'svelte';
	import EditGroupAvatar from './edit_group/EditGroupAvatar.svelte';
	import EditGroupModal from './edit_group/EditGroupModal.svelte';
	import AddMemberModal from './edit_group/AddMemberModal.svelte';
	import MuteGroupModal from './MuteGroupModal.svelte';
	import { friendStore } from '$lib/stores/friendStore';
	import { leaveGroup } from '$lib/socket';

	export let group: Group;
	export let onClose: () => void;

	// TODO: Make group detail full screen in mobile mode?
	let currentUserId: number | null = null;
	let isCurrentUserAdmin = false;
	let showAddMemberModal = false;
	let showEditGroupModal = false;
	let showEditAvatarModal = false;
	let showMuteGroupModal = false;
	let showSettingsDropdown = false;
	let muteDurationHours: number | null = null;

	let editGroupName: string = '';
	let editGroupDescription: string = '';
	let editGroupColour: string = '';
	let groupColor: string = 'var(--primary-colour)';
	let textColor: string = 'white';

	let newMemberUsername: string = '';
	let filteredFriends: Array<{
		user_id: number;
		username: string;
		avatar?: string;
		avatar_version?: number;
	}> = [];
	let group_members: Array<{ user_id: number; username: string; avatar: string | null }> = [];
	let isDoneRetrievingGroupMembers = false;

	async function getGroupMembers() {
		if (isDoneRetrievingGroupMembers) {
			console.log('Already retrieved group members, skipping...');
			return;
		}
		console.log("getting group member");
		let newMembers = [];

		const authState = get(authStore);
		let myUserId: number | null = null;
		if (authState.isAuthenticated && authState.user) {
			myUserId = authState.user.id;
			const myUsername = authState.user.username;
			const myUserAvatar = get(userAvatar);
			newMembers.push({
				user_id: myUserId,
				username: myUsername,
				avatar: myUserAvatar
			});
		}

		let userIdsToRetrieve = [];
		let avatarIdsToRetrieve = [];
		for (const userId of group.user_ids) {
			if (myUserId === userId) continue;

			const groupUser = await userStore.getUser(userId);
			const avatarUser = await avatarStore.getAvatar(userId);

			if (groupUser && avatarUser) {
				if (!newMembers.some(member => member.user_id === groupUser.id)) {
					newMembers.push({
						user_id: groupUser.id,
						username: groupUser.username,
						avatar: avatarUser
					});
				}
			} else if (groupUser && !avatarUser) {
				avatarIdsToRetrieve.push(userId);
				if (!newMembers.some(member => member.user_id === groupUser.id)) {
					newMembers.push({
						user_id: groupUser.id,
						username: groupUser.username,
						avatar: null
					});
				}
			} else if (!groupUser && avatarUser) {
				userIdsToRetrieve.push(userId);
				if (!newMembers.some(member => member.user_id === userId)) {
					newMembers.push({
						user_id: userId,
						username: 'User',
						avatar: avatarUser
					});
				}
			} else {
				userIdsToRetrieve.push(userId);
				avatarIdsToRetrieve.push(userId);
				if (!newMembers.some(member => member.user_id === userId)) {
					newMembers.push({
						user_id: userId,
						username: 'User',
						avatar: null
					});
				}
			}
		}

		group_members = newMembers;
		console.log("group Meberms size ", group_members.length);
		const accessToken = get(accessTokenValue);
		if (userIdsToRetrieve.length > 0 && accessToken) {
			retrieveMissingUsers(userIdsToRetrieve, accessToken).then(async (_) => {
				for (const userId of avatarIdsToRetrieve) {
					const user = await userStore.getUser(userId);
					if (user) {
						const updatedUser = await updateUserAvatar(user);
						if (updatedUser) {
							group_members = group_members.map(member =>
								member.user_id === updatedUser.id
									? {
										...member,
										username: updatedUser.username,
										avatar: updatedUser.avatar ?? null
									}
									: member
							);
						}
					}
				}
				isDoneRetrievingGroupMembers = true;
			});
		}
	}

	$: {
		getGroupMembers();
	}

	$: {
		const authState = get(authStore);
		currentUserId = authState.user?.id || null;
		isCurrentUserAdmin = currentUserId ? group.admin_ids.includes(currentUserId) : false;

		// Initialize edit form fields
		editGroupName = group.name || '';
		editGroupDescription = group.description || '';
        editGroupColour = group.colour || 'var(--primary-colour)';
        groupColor = group.colour || 'var(--primary-colour)';
		textColor = getTextColorForBackground(groupColor);
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
				leaveGroup(group.group_id);
				const friendIds: number[] = $friendStore.friends.map((friend) => friend.friend_id);

				for (const userId of group.user_ids) {
					if (!friendIds.includes(userId)) {
						userStore.removeUserFromStorage(userId);
						avatarStore.removeAvatarFromStorage(userId);
					}
				}
				onClose();
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function toggleSettingsDropdown() {
		showSettingsDropdown = !showSettingsDropdown;
	}

	function closeSettingsDropdown() {
		showSettingsDropdown = false;
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
		showSettingsDropdown = false;
	};

	async function handleRemoveMember(userId: number) {
		try {
			const success = await groupStore.removeGroupMember(group.group_id, userId);
			if (success) {
				successToast('Member removed successfully');
				const updatedGroup = await groupStore.getGroup(group.group_id);
				if (updatedGroup) {
					updatedGroup.avatar = group.avatar;
					group = updatedGroup;
				}
				isDoneRetrievingGroupMembers = false;
				getGroupMembers();
				const friendIds: number[] = $friendStore.friends.map((friend) => friend.friend_id);
				if (!friendIds.includes(userId)) {
					userStore.removeUserFromStorage(userId);
					avatarStore.removeAvatarFromStorage(userId);
				}
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
				const updatedGroup = await groupStore.getGroup(group.group_id);
				if (updatedGroup) {
					updatedGroup.avatar = group.avatar;
					group = updatedGroup;
				}
				isDoneRetrievingGroupMembers = false;
				getGroupMembers();
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleAddMember(userId: number) {
		try {
			group.group_version = group.group_version + 1;
			groupStore.updateGroup(group);
			const success = await groupStore.addGroupMember(group.group_id, userId);
			if (success) {
				successToast('Member added successfully');
				showAddMemberModal = false;
				newMemberUsername = '';
				filteredFriends = [];
				const updatedGroup = await groupStore.getGroup(group.group_id);
				if (updatedGroup) {
					updatedGroup.avatar = group.avatar;
					group = updatedGroup;
				}
				isDoneRetrievingGroupMembers = false;
				getGroupMembers();
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
			group.group_version = group.group_version - 1;
			groupStore.updateGroup(group);
		}
	}
	let socketEventUnsubscribe: (() => void) | null = null;

	onMount(() => {
		socketEventUnsubscribe = socketEventStore.subscribe((events) => {
			events.forEach(async (event) => {
				console.log('socket event', event);
				if (event.type === 'group_avatar_updated') {
					// It is updated in the group list view, we wait a bit and update it here by taking what is stored.
					await new Promise((resolve) => setTimeout(resolve, 1000));
					const updatedAvatar = await avatarStore.getGroupAvatar(group.group_id);
					if (updatedAvatar) {
						group.avatar = updatedAvatar;
					}
					return;
				}
				const updatedGroup = await groupStore.getGroup(group.group_id);
				if (updatedGroup) {
					updatedGroup.avatar = group.avatar;
					group = updatedGroup;
				}
				isDoneRetrievingGroupMembers = false;
				getGroupMembers();
			});
		});
	});

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
		<div class="modal-header" style="background-color: {groupColor}; color: {textColor};">
			<h2>Group Details</h2>
			<button class="header-close-btn" on:click={onClose}>×</button>
		</div>

		<div class="modal-body">
			<div class="modal-body-header">
				<!-- Avatar on the left -->
				<div class="group-avatar-container">
					{#if group.avatar}
						<img class="group-avatar" src={group.avatar} alt={group.name} />
					{:else}
						<div
							class="group-avatar"
							style="background-color: {group.colour || getRandomColour()}"
						>
							{getInitial(group.name || 'G')}
						</div>
					{/if}
				</div>

				<!-- Settings button on the right -->
				<div class="settings-container" on:focusout={handleDropdownFocusLoss}>
					<button class="settings-btn" on:click={toggleSettingsDropdown}>⚙️</button>
					<div class="dropdown-menu" style:visibility={showSettingsDropdown ? 'visible' : 'hidden'}>
						{#if isCurrentUserAdmin}
							<button
								class="dropdown-item"
								on:click={() => {
									showEditAvatarModal = true;
									closeSettingsDropdown();
								}}>Edit Avatar</button
							>
							<button
								class="dropdown-item"
								on:click={() => {
									showEditGroupModal = true;
									closeSettingsDropdown();
								}}>Edit Group</button
							>
						{/if}
						<button
							class="dropdown-item"
							on:click={() => {
								showMuteGroupModal = true;
								closeSettingsDropdown();
							}}
						>
							{group.mute ? 'Unmute Group' : 'Mute Group'}
						</button>
					</div>
				</div>
			</div>

			<div class="group-details">
				<div class="group-info">
					<h4>{group.name}</h4>
					<p class="group-description">{group.description || 'No description'}</p>
				</div>

				<div class="group-meta">
					<p><strong>Members:</strong> {group.user_ids.length}</p>
					<p><strong>Admins:</strong> {group.admin_ids.length}</p>
					<p><strong>Status:</strong> {group.mute ? 'Muted' : 'Active'}</p>
				</div>

				{#if isCurrentUserAdmin}
					<div class="group-actions">
						<button
							class="add-member-btn"
							on:click={() => (showAddMemberModal = true)}
							style="background-color: {groupColor}; color: {textColor};"
						>
							Add Member
						</button>
					</div>
				{/if}

				<div class="group-members">
					<h3>Members</h3>
					<ul>
						{#each group_members as group_member (group_member.user_id)}
							<li class="member-item">
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
											style="background-color: {getRandomColour()}"
										>
											{getInitial(group_member.username)}
										</div>
									{/if}
								</div>

								<div class="member-username-container">
									<span class="member-username">
										{group_member.username}
									</span>
								</div>

								<div class="member-actions-container">
									{#if group_member.user_id === currentUserId}
										<span class="you-badge">You</span>
									{:else if isCurrentUserAdmin && group_member.user_id !== currentUserId}
										{#if group.admin_ids.includes(group_member.user_id)}
											<button
												class="demote-btn"
												on:click={() => handlePromoteAdmin(group_member.user_id, false)}
												style="background-color: #f39c12; color: var(--text-colour-on-primary);"
											>
												Demote
											</button>
										{:else}
											<button
												class="promote-btn"
												on:click={() => handlePromoteAdmin(group_member.user_id, true)}
												style="background-color: #2ecc71; color: var(--text-colour-on-primary);"
											>
												Promote
											</button>
										{/if}
										<button
											class="remove-btn"
											on:click={() => handleRemoveMember(group_member.user_id)}
											style="background-color: #e74c3c; color: var(--text-colour-on-primary);"
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

		<!-- Modals -->
		{#if showAddMemberModal}
			<AddMemberModal
				onClose={() => (showAddMemberModal = false)}
				onAddMember={handleAddMember}
				group_user_ids={group.user_ids}
				{groupColor}
				{textColor}
			/>
		{/if}

		{#if showEditGroupModal}
			<EditGroupModal
				{group}
				onClose={() => (showEditGroupModal = false)}
				onSave={async (updatedGroup) => {
					try {
						group.group_version = group.group_version + 1;
						groupStore.updateGroup(group);
						const success = await groupStore.updateGroupDetails(
							group.group_id,
							updatedGroup.groupName,
							updatedGroup.groupDescription,
							updatedGroup.groupColour
						);
						if (success) {
							successToast('Group updated successfully');
							const updatedGroupData = await groupStore.getGroup(group.group_id);
							if (updatedGroupData) {
								updatedGroupData.avatar = group.avatar;
								group = updatedGroupData;
							}
							groupStore.updateGroupNotSave(group);
						}
					} catch (error) {
						errorToast(error instanceof Error ? error.message : 'Unknown error');
						group.group_version = group.group_version - 1;
						groupStore.updateGroup(group);
					}
				}}
				{textColor}
			/>
		{/if}

		{#if showEditAvatarModal}
			<EditGroupAvatar
				groupId={group.group_id}
				groupAvatar={group.avatar}
				{groupColor}
				{textColor}
				{group}
				onClose={() => (showEditAvatarModal = false)}
				onSave={async (data) => {
					const accessToken = get(accessTokenValue);
					if (accessToken && data.avatar) {
						// Already set the new versions so it won't retrieve the data again, revert if it fails.
						group.avatar_version = group.avatar_version + 1;
						group.group_version = group.group_version + 1;
						groupStore.updateGroup(group);
						const result = await handleChangeGroupAvatar(
							accessToken,
							group.group_id,
							data.avatar,
							data.defaultAvatar || false
						);
						if (result.success) {
							successToast('Group avatar updated successfully!');
							const reader = new FileReader();
							reader.onload = async () => {
								const newAvatar = reader.result as string;
								group.avatar = newAvatar;
								await avatarStore.updateGroupAvatar(group.group_id, newAvatar);
								groupStore.updateGroup(group);
								showEditAvatarModal = false;
							};
							reader.readAsDataURL(data.avatar);
						} else {
							errorToast(result.message || 'Failed to update group avatar');
							group.avatar_version = group.avatar_version - 1;
							group.group_version = group.group_version - 1;
							groupStore.updateGroup(group);
						}
					}
				}}
			/>
		{/if}

		{#if showMuteGroupModal}
			<MuteGroupModal
				{group}
				onClose={() => (showMuteGroupModal = false)}
				{groupColor}
				{textColor}
			/>
		{/if}

		<div class="modal-footer">
			<button
				class="leave-btn"
				on:click={handleLeaveGroup}
				style="background-color: {groupColor}; color: {textColor};">Leave Group</button
			>
			<button class="footer-close-btn" on:click={onClose}>Close</button>
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
		height: 80%;
		max-width: 1100px;
		max-height: 800px;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 12px 12px 0 0;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.header-close-btn {
		background: none;
		border: none;
		color: var(--text-colour-on-primary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-body {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		position: relative;
	}

	.modal-body-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}

	.group-avatar-container {
		width: 240px;
		height: 240px;
		flex-shrink: 0;
	}

	.group-avatar {
		width: 240px;
		height: 240px;
		object-fit: cover;
		border-radius: 12px;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.settings-container {
		position: relative;
		display: inline-block;
	}

	.settings-btn {
		background: transparent;
		color: #333;
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

	.settings-btn:hover {
		filter: brightness(0.9);
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
		margin-top: 0.5rem;
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

	.group-details {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.group-info h4 {
		margin: 0;
		color: #333;
		font-size: 1.8rem;
	}

	.group-description {
		margin: 0.5rem 0 0 0;
		color: #666;
		font-size: 1rem;
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
		justify-content: flex-start;
		margin-top: 1rem;
		margin-bottom: 1rem;
	}

	.add-member-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.add-member-btn:hover {
		filter: brightness(0.9);
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

	.promote-btn {
		padding: 0.3rem 0.6rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.demote-btn {
		padding: 0.3rem 0.6rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.remove-btn {
		padding: 0.3rem 0.6rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.8rem;
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
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.leave-btn:hover {
		filter: brightness(0.9);
	}

	.footer-close-btn {
		padding: 0.5rem 1rem;
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.footer-close-btn:hover {
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
		color: var(--text-colour-on-primary);
		font-weight: bold;
		font-size: 1rem;
		background-color: #ccc;
	}

	.member-username-container {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-align: left;
		padding: 0 1rem;
	}

	.member-username {
		display: block;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-weight: 500;
		color: #333;
	}

	.member-actions-container {
		width: 120px;
		flex-shrink: 0;
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		padding-left: 1rem;
	}

	.you-badge {
		padding: 0.2rem 0.5rem;
		background-color: #3498db;
		color: var(--text-colour-on-primary);
		border-radius: 4px;
		font-size: 0.7rem;
		margin-left: 0.5rem;
	}
</style>
