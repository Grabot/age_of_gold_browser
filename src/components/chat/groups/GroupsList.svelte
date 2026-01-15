<script lang="ts">
	import { groupStore } from '../../../stores/groupStore';
	import GroupDetailModal from './GroupDetailModal.svelte';
	import type { Group } from '../../../types/groups';
	import { onMount } from 'svelte';
	import { avatarStore } from '../../../stores/avatarStore';
	import { accessTokenValue } from '../../../stores/authStore';
	import {
		handleGetGroupAvatar,
		handleGetGroupAvatarVersion
	} from '../../../services/settingsService';
	import { errorToast } from '../../../utils/toast';

	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

	let selectedGroup: Group | null = null;
	let showDetailModal = false;

	async function updateGroupAvatar(group: Group) {
		const accessToken = $accessTokenValue;
		if (accessToken && group) {
			const avatarResponse = await handleGetGroupAvatar(accessToken, group.group_id, false);
			if (avatarResponse.success && avatarResponse.avatar) {
				group.avatar = avatarResponse.avatar;
				avatarStore.updateGroupAvatar(group.group_id, avatarResponse.avatar);
				const avatarVersionResponse = await handleGetGroupAvatarVersion(
					accessToken,
					group.group_id
				);
				if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
					group.avatar_version = avatarVersionResponse.avatarVersion;
				}
				groupStore.updateGroup(group);
				avatarStore.setShouldUpdateAvatarForUser(group.group_id, false);
			} else {
				errorToast('Failed to fetch avatar');
			}
		}
	}

	async function checkGroupAvatar(group: Group) {
		if (!group.avatar) {
			const avatarGroup = avatarStore.getGroupAvatar(group.group_id);
			if (avatarGroup) {
				group.avatar = avatarGroup;
				groupStore.updateGroup(group);
			} else {
				await updateGroupAvatar(group);
			}
		}
	}

	onMount(() => {
		const unsubscribe = groupStore.subscribe((storeState) => {
			if (!storeState.loading) {
				storeState.groups.forEach(async (group) => {
					if (avatarStore.getShouldUpdateGroupAvatarForGroup(group.group_id)) {
						await updateGroupAvatar(group);
					} else {
						await checkGroupAvatar(group);
					}
				});
			}
		});

		return () => unsubscribe();
	});
</script>

<div class="groups-list">
	{#if $groupStore.groups.length > 0}
		<div class="section-separator-top">
			<span>Your Groups</span>
		</div>
		{#each $groupStore.groups as group (group.group_id)}
			<button
				class="group-item"
				on:click={() => {
					selectedGroup = group;
					showDetailModal = true;
				}}
				type="button"
				aria-label="View details for group {group.group_id}"
				style="background-color: {group.group_colour || getRandomColor('Group')}"
			>
				<div class="avatar-container">
					{#if group.avatar}
						<img class="group-avatar" src={group.avatar} alt={group.group_name} />
					{:else}
						<div
							class="group-avatar placeholder"
							style="background-color: {getRandomColor(group.group_name || '')}"
						>
							{getInitial(group.group_name || '')}
						</div>
					{/if}
				</div>
				<div class="group-text">
					<span class="group-name">{group.group_name || 'Unnamed Group'}</span>
					{#if group.unread_messages > 0}
						<span class="unread-badge">{group.unread_messages}</span>
					{/if}
				</div>
			</button>
		{/each}
	{:else}
		<p class="no-groups">You don't have any groups yet. Create a group to get started!</p>
	{/if}

	<!-- Group Detail Modal -->
	{#if showDetailModal && selectedGroup}
		<GroupDetailModal
			group={selectedGroup}
			onClose={() => (showDetailModal = false)}
			{getRandomColor}
			{getInitial}
		/>
	{/if}
</div>

<style>
	.groups-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-separator-top {
		font-size: 0.9rem;
		color: #7f8c8d;
		font-weight: 500;
		padding: 1rem 0 0.5rem 0;
	}

	.group-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 12px;
		border-radius: 8px;
		text-align: left;
		border: none;
		background: transparent;
		cursor: pointer;
		color: white;
		font-weight: bold;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.group-item:hover {
		transform: scale(1.02);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.group-item:active {
		transform: scale(0.98);
	}

	.group-text {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		color: white;
		font-weight: 500;
	}

	.group-name {
		font-weight: 500;
		color: white;
		font-size: 1rem;
	}

	.unread-badge {
		background-color: #e74c3c;
		color: white;
		width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: bold;
	}

	.no-groups {
		text-align: center;
		padding: 2rem;
		color: #7f8c8d;
		font-style: italic;
	}

	.group-avatar {
		width: 40px;
		height: 40px;
		object-fit: cover;
		border: 2px solid rgba(255, 255, 255, 0.3);
	}

	.group-avatar.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		font-size: 1rem;
		width: 40px;
		height: 40px;
	}

	.avatar-container {
		flex-shrink: 0;
	}
</style>
