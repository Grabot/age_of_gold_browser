<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import GroupDetailModal from './GroupDetailModal.svelte';
	import type { Group } from '$lib/types/groups';
	import { onMount, onDestroy } from 'svelte';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { getRandomColour, getInitial } from '$lib/utils/groupUtils';
	import { getTextColourForBackground } from '$lib/utils/colourUtils';
	import { updateGroupAvatar } from '$lib/utils/avatarUtils';
	import { socketEventStore } from '$lib/stores/socketEventStore';

	let selectedGroup: Group | null = null;
	let showDetailModal = false;
	let socketEventUnsubscribe: (() => void) | null = null;

	const colourCache = new Map<number, string>();

	function getBackgroundColor(group: Group) {
		if (!colourCache.has(group.group_id)) {
			colourCache.set(group.group_id, group.colour || getRandomColour());
		}
		return colourCache.get(group.group_id)!;
	}

	async function checkGroupAvatar(group: Group) {
		console.log('Checking group avatar for group:', group.group_id);
		if (!group.avatar) {
			const avatarGroup = await avatarStore.getGroupAvatar(group.group_id);
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
		const unsubscribe = groupStore.subscribe(async (storeState) => {
			if (!storeState.loading) {
				for (const group of storeState.groups) {
					const shouldUpdate = await avatarStore.getShouldUpdateGroupAvatarForGroup(group.group_id);
					if (shouldUpdate) {
						await updateGroupAvatar(group);
					} else {
						await checkGroupAvatar(group);
					}
				}
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
		{#each $groupStore.groups as group (group.group_id)}
			<div
				class="group-item"
				style="--bg: {getBackgroundColor(group)}; --text: {getTextColourForBackground(getBackgroundColor(group))}"
				role="button"
				tabindex="0"
				aria-label="View details for group {group.name || group.group_id}"
				onclick={() => {
					selectedGroup = group;
					showDetailModal = true;
				}}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						selectedGroup = group;
						showDetailModal = true;
					}
				}}
			>
				<div class="avatar">
					{#if group.avatar}
						<img src={group.avatar} alt={group.name} />
					{:else}
						<span class="initial">{getInitial(group.name || '')}</span>
					{/if}
				</div>
				<div class="info">
					<span class="group-name">{group.name || 'Unnamed Group'}</span>
				</div>
				{#if group.unread_messages > 0}
					<div class="unread-badge">{group.unread_messages}</div>
				{/if}
			</div>
		{/each}
	{:else}
		<p class="no-groups">You don't have any groups yet. Create a group to get started!</p>
	{/if}
</div>

{#if showDetailModal && selectedGroup}
	<GroupDetailModal group={selectedGroup} onClose={() => (showDetailModal = false)} />
{/if}

<style>
	.groups-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.5rem;
		width: 100%;
	}

	.group-item {
		position: relative;
		display: flex;
		align-items: center;
		background: var(--bg);
		border-radius: 12px;
		padding: 0.7rem 0.85rem;
		gap: 0.75rem;
		cursor: pointer;
		overflow: hidden;
		border: none;
		text-align: left;
	}
	.group-item:hover {
		filter: brightness(0.92);
	}
	.group-item:focus-visible {
		outline: 3px solid rgba(255, 255, 255, 0.6);
		outline-offset: 2px;
	}

	.avatar {
		width: 42px;
		height: 42px;
		flex-shrink: 0;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.initial {
		color: var(--text);
		font-weight: 700;
		font-size: 1rem;
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.group-name {
		color: var(--text);
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.unread-badge {
		background-color: #e74c3c;
		color: white;
		min-width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.no-groups {
		text-align: center;
		padding: 2rem;
		color: #7f8c8d;
		font-style: italic;
	}
</style>