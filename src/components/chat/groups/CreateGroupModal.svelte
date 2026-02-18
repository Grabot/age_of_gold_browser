<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import { friendStore } from '$lib/stores/friendStore';
	import { errorToast, successToast } from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import { accessTokenValue, authStore } from '$lib/stores/authStore';
	import { getRandomColour } from '$lib/utils/groupUtils';
	import { handleGetGroupAvatar } from '$lib/services/settingsService';
	import { get } from 'svelte/store';
	import { avatarStore } from '$lib/stores/avatarStore';
	import ColourPickerModal from '$lib/components/ColourPickerModal.svelte';
	import { joinGroup } from '$lib/socket';

	export let onClose: () => void;

	let myUserId: number | null = null;
	let groupName: string = '';
	let groupDescription: string = '';
	let groupColour: string = getRandomColour();
	let selectedFriends: number[] = [];
	let showColourPicker = false;

	$: availableFriends = $friendStore.friends.filter((f) => f.accepted === true && f.user);

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	onMount(async () => {
		authStore.subscribe((state) => {
			if (state.isAuthenticated && state.user) {
				myUserId = state.user.id;
			}
		});
	});

	function toggleFriendSelection(friendId: number) {
		if (selectedFriends.includes(friendId)) {
			selectedFriends = selectedFriends.filter((id) => id !== friendId);
		} else {
			selectedFriends = [...selectedFriends, friendId];
		}
	}

	async function handleCreateGroup() {
		if (!groupName.trim()) {
			errorToast('Group name is required');
			return;
		}

		if (myUserId == null) {
			errorToast('User not authenticated');
			return;
		}

		try {
			const successGroupId = await groupStore.createGroup({
				groupName: groupName.trim(),
				groupDescription: groupDescription.trim(),
				groupColour: groupColour,
				friendIds: selectedFriends,
				meId: myUserId
			});

			if (successGroupId) {
				successToast('Group created successfully!');
				setTimeout(async () => {
					joinGroup(successGroupId);
					const accessToken = get(accessTokenValue);
					if (accessToken) {
						const avatarResponse = await handleGetGroupAvatar(accessToken, successGroupId, false);
						if (avatarResponse.success && avatarResponse.avatar) {
							await avatarStore.updateGroupAvatar(successGroupId, avatarResponse.avatar);
						}
					}
					resetForm();
					onClose();
				}, 1500);
			} else {
				errorToast('Failed to create group');
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function resetForm() {
		groupName = '';
		groupDescription = '';
        groupColour = 'var(--primary-colour)';
		selectedFriends = [];
	}

	function closeModal() {
		resetForm();
		onClose();
	}
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
	aria-label="Create Group"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Create New Group</h2>
			<button class="close-btn" on:click={onClose}>x</button>
		</div>

		<div class="modal-body-scrollable">
			<div class="form-group">
				<label for="groupName">Group Name *</label>
				<input
					type="text"
					id="groupName"
					bind:value={groupName}
					placeholder="Enter group name"
					required
				/>
			</div>

			<div class="form-group">
				<label for="groupDescription">Group Description</label>
				<textarea
					id="groupDescription"
					bind:value={groupDescription}
					placeholder="Enter group description (optional)"
					rows="3"
				></textarea>
			</div>

			<div class="form-group">
				<label for="groupColour">Group Colour</label>
				<div class="colour-picker-trigger" on:click={() => showColourPicker = true} role="button" tabindex="0" on:keydown={(e) => e.key === 'Enter' && (showColourPicker = true)}>
					<div class="colour-preview" style="background-color: {groupColour}"></div>
					<span class="colour-label">{groupColour}</span>
				</div>
			</div>

			{#if showColourPicker}
				<ColourPickerModal 
					initialColour={groupColour}
					onSave={(colour) => {
						groupColour = colour;
						showColourPicker = false;
					}}
					onClose={() => showColourPicker = false}
				/>
			{/if}

			<div class="form-group">
				<legend>Select Friends to Add</legend>
				<div class="friends-selection">
					{#if availableFriends.length > 0}
						{#each availableFriends as friend (friend.friend_id)}
							<div
								class="friend-item"
								class:selected={selectedFriends.includes(friend.friend_id)}
								on:click={() => toggleFriendSelection(friend.friend_id)}
								on:keydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										toggleFriendSelection(friend.friend_id);
									}
								}}
								role="button"
								tabindex="0"
								aria-pressed={selectedFriends.includes(friend.friend_id)}
							>
								<input
									type="checkbox"
									id={`friend-${friend.friend_id}`}
									checked={selectedFriends.includes(friend.friend_id)}
									on:change={() => toggleFriendSelection(friend.friend_id)}
									on:click|stopPropagation
								/>
								<span class="friend-name">
									{#if friend.user}
										{friend.user.username}
									{/if}
								</span>
							</div>
						{/each}
					{:else}
						<p class="no-friends">No friends available to add to group. Add some friends first!</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" on:click={closeModal}>Cancel</button>
			<button class="create-btn" on:click={handleCreateGroup}>Create Group</button>
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
        background: var(--primary-colour);
		color: var(--text-colour-on-primary);
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
		color: var(--text-colour-on-primary);
		font-size: 1.5rem;
		cursor: pointer;
	}

	.modal-body-scrollable {
		overflow-y: auto;
		padding: 1rem;
		flex: 1;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #333;
	}

	.form-group input[type='text'],
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.colour-picker-trigger {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
	}

	.colour-picker-trigger:hover {
		background-color: #f5f5f5;
		border-color: #ccc;
	}

	.colour-preview {
		width: 40px;
		height: 40px;
		border-radius: 4px;
		border: 2px solid #ddd;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.colour-label {
		font-family: monospace;
		font-size: 0.9rem;
		color: #666;
	}

	.friends-selection {
		max-height: none;
		border: 1px solid #eee;
		border-radius: 4px;
		padding: 0.5rem;
	}

	.friend-item {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		margin-bottom: 0.5rem;
	}

	.friend-item:hover {
		background-color: #f5f5f5;
	}

	.friend-item.selected {
		background-color: #e8f5e9;
        border: 1px solid var(--primary-colour);
	}

	.friend-item input[type='checkbox'] {
		margin-right: 0.75rem;
		cursor: pointer;
	}

	.friend-name {
		flex: 1;
		color: #333;
		font-size: 1rem;
	}

	.no-friends {
		color: #666;
		font-style: italic;
		margin: 0.5rem 0;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding: 1rem;
		border-top: 1px solid #eee;
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background-color: #e0e0e0;
	}

	.create-btn {
		padding: 0.5rem 1rem;
        background-color: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.create-btn:hover {
        background-color: var(--primary-colour-dark);
	}
</style>
