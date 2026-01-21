<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import GroupDetailModal from './GroupDetailModal.svelte';
	import type { Group } from '$lib/types/groups';
	import { onMount, onDestroy } from 'svelte';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { getRandomColor, getInitial, getTextColorForBackground } from '$lib/utils/groupUtils';
	import { updateGroupAvatar } from '$lib/utils/avatarUtils';
	import { socketEventStore } from '$lib/stores/socketEventStore';

	let selectedGroup: Group | null = null;
	let showDetailModal = false;
	let socketEventUnsubscribe: (() => void) | null = null;

	async function checkGroupAvatar(group: Group) {
		console.log('Checking group avatar for group:', group.group_id);
		if (!group.avatar) {
			const avatarGroup = avatarStore.getGroupAvatar(group.group_id);
			if (avatarGroup) {
				group.avatar = avatarGroup;
				groupStore.updateGroupNotSave(group);
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
						console.log('it is decided that it should update the avatar!');
						await updateGroupAvatar(group);
					} else {
						await checkGroupAvatar(group);
					}
				});
			}
		});

		socketEventUnsubscribe = socketEventStore.subscribe((events) => {
			events.forEach(async (event) => {
				console.log('socket event', event);
				if (event.type === 'group_avatar_updated') {
					const group = $groupStore.groups.find((g) => g.group_id === event.data?.group_id);
					if (group) {
						if (group.avatar_version !== event.data.avatar_version) {
							const newGroup = await updateGroupAvatar(group);
							if (newGroup) {
								groupStore.updateGroup(newGroup);
							}
						}
					}
				}
			});
		});

		return () => {
			unsubscribe();
			if (socketEventUnsubscribe) {
				socketEventUnsubscribe();
			}
		};
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
				style="background-color: {group.group_colour ||
					getRandomColor('Group')}; color: {group.group_colour
					? getTextColorForBackground(group.group_colour)
					: getTextColorForBackground(getRandomColor('Group'))};"
			>
				<div class="avatar-container">
					{#if group.avatar}
						<img class="group-avatar" src={group.avatar} alt={group.group_name} />
					{:else}
						<div
							class="group-avatar placeholder"
							style="background-color: {getRandomColor(
								group.group_name || ''
							)}; color: {getTextColorForBackground(getRandomColor(group.group_name || ''))}"
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
		<GroupDetailModal group={selectedGroup} onClose={() => (showDetailModal = false)} />
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
