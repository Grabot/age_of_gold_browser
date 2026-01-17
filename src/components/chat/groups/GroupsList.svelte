<script lang="ts">
import { groupStore } from '../../../stores/groupStore';
import GroupDetailModal from './GroupDetailModal.svelte';
import type { Group } from '../../../types/groups';
import { onMount, afterUpdate } from 'svelte';
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

	// Function to determine text color based on background color brightness
	function getTextColorForBackground(bgColor: string): string {
		// Remove # if present
		const color = bgColor.startsWith('#') ? bgColor.substring(1) : bgColor;

		// Parse hex color
		const r = parseInt(color.substring(0, 2), 16) / 255;
		const g = parseInt(color.substring(2, 4), 16) / 255;
		const b = parseInt(color.substring(4, 6), 16) / 255;

		// Calculate relative luminance using the formula:
		// L = 0.2126*R + 0.7152*G + 0.0722*B
		const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

		// Use white text for dark backgrounds, black text for light backgrounds
		// Threshold of 0.5 is commonly used for accessibility
		return luminance > 0.5 ? 'black' : 'white';
	}

	// Helper function to get button style based on group color
	function getGroupItemStyle(group: Group): string {
		if (group.group_colour) {
			const textColor = getTextColorForBackground(group.group_colour);
			return `background-color: ${group.group_colour}; color: ${textColor};`;
		} else {
			return `background-color: ${getRandomColor('Group')}; color: white;`;
		}
	}

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
					console.log("updating avatar version", avatarVersionResponse.avatarVersion);
					group.avatar_version = avatarVersionResponse.avatarVersion;
				}
				groupStore.updateGroup(group);
				avatarStore.setShouldUpdateGroupAvatarForGroup(group.group_id, false);
			} else {
				errorToast('Failed to fetch avatar');
			}
		}
	}

	async function checkGroupAvatar(group: Group) {
		console.log('Checking group avatar for group:', group.group_id);
		if (!group.avatar) {
			const avatarGroup = avatarStore.getGroupAvatar(group.group_id);
			if (avatarGroup) {
				group.avatar = avatarGroup;
				groupStore.updateGroup(group);
			} else {
				console.log('No avatar found for group:', group.group_id);
				await updateGroupAvatar(group);
			}
		}
	}

	onMount(() => {
		const unsubscribe = groupStore.subscribe((storeState) => {
			if (!storeState.loading) {
				console.log('Processing groups:', storeState.groups);
				storeState.groups.forEach(async (group) => {
					if (avatarStore.getShouldUpdateGroupAvatarForGroup(group.group_id)) {
						console.log("it is decided that it should update the avatar!");
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
				style="background-color: {group.group_colour || getRandomColor('Group')}; color: {group.group_colour ? getTextColorForBackground(group.group_colour) : getTextColorForBackground(getRandomColor('Group'))};"
			>
				<div class="avatar-container">
					{#if group.avatar}
						<img class="group-avatar" src={group.avatar} alt={group.group_name} />
					{:else}
						<div
							class="group-avatar placeholder"
							style="background-color: {getRandomColor(group.group_name || '')}; color: {getTextColorForBackground(getRandomColor(group.group_name || ''))}"
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
		font-weight: bold;
		transition:
			transform 0.1s ease,
			box-shadow 0.1s ease;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.group-item:hover {
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	}

	.group-text {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-weight: 500;
	}

	.group-name {
		font-weight: 500;
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
