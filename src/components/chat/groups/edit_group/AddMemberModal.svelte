<script lang="ts">
	import { friendStore } from '$lib/stores/friendStore';
	import { authStore } from '$lib/stores/authStore';
	import { get } from 'svelte/store';
	import { getRandomColour, getInitial } from '$lib/utils/groupUtils';

	export let onClose: () => void;
	export let onAddMember: (userId: number) => void;
	export let group_user_ids: number[];
	export let groupColor: string = 'var(--primary-colour)';
	export let textColor: string = 'white';

	let newMemberUsername: string = '';
	let filteredFriends: Array<{
		user_id: number;
		username: string;
		avatar?: string;
		avatar_version?: number;
	}> = [];

	// Filter friends based on search query
	$: {
		const friends = get(friendStore).friends;
		const authState = get(authStore);
		const currentUserId = authState.user?.id || null;

		// Filter friends that are accepted and not the current user
		let availableFriends = friends.filter(
			(friend) =>
				friend.accepted === true &&
				friend.user &&
				friend.friend_id !== currentUserId &&
				!group_user_ids.includes(friend.friend_id)
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

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function clearSearch() {
		newMemberUsername = '';
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
	aria-label="Add Member"
>
	<div class="modal-content">
		<div class="modal-header" style="background-color: {groupColor}; color: {textColor};">
			<h3>Add Member</h3>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>

		<div class="modal-body">
			<div class="search-section">
				<div class="search-input-container">
					<input
						type="text"
						placeholder="Search your friends..."
						bind:value={newMemberUsername}
						class="search-input"
					/>
					{#if newMemberUsername}
						<button class="clear-search-btn" on:click={clearSearch}>×</button>
					{/if}
				</div>
			</div>

			{#if filteredFriends.length > 0}
				<div class="search-results">
					<h4>Your Friends</h4>
					<ul class="friends-list">
						{#each filteredFriends as friend (friend.user_id)}
							<li class="friend-item">
								<div class="friend-avatar-container">
									{#if friend.avatar}
										<img class="friend-avatar" src={friend.avatar} alt={friend.username} />
									{:else}
										<div
											class="friend-avatar placeholder"
											style="background-color: {getRandomColour()}"
										>
											{getInitial(friend.username)}
										</div>
									{/if}
								</div>
								<div class="friend-info">
									<span class="friend-username">{friend.username}</span>
								</div>
								<button class="add-btn" on:click={() => onAddMember(friend.user_id)}> Add </button>
							</li>
						{/each}
					</ul>
				</div>
			{:else if newMemberUsername}
				<p class="no-results">No friends found matching "{newMemberUsername}"</p>
			{:else}
				<p class="no-results">You don't have any friends to add to this group.</p>
			{/if}
		</div>

		<div class="modal-footer">
			<button class="cancel-btn" on:click={onClose}>Cancel</button>
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
		z-index: 1002;
	}

	.modal-content {
		background: white;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
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
		border-radius: 12px 12px 0 0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-colour-on-primary);
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.search-section {
		margin-bottom: 1rem;
	}

	.search-input-container {
		position: relative;
		width: 100%;
	}

	.search-input {
		width: 100%;
		padding: 0.75rem 2.5rem 0.75rem 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
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

	.friends-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.friend-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 0.75rem;
		border-bottom: 1px solid #eee;
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
		color: var(--text-colour-on-primary);
		font-weight: bold;
		font-size: 1rem;
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
		padding: 0.5rem 1rem;
		background-color: #2ecc71;
		color: var(--text-colour-on-primary);
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.add-btn:hover {
		background-color: #27ae60;
	}

	.no-results {
		text-align: center;
		padding: 1rem;
		color: #666;
		font-style: italic;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		margin-bottom: 1.5rem;
		margin-right: 1.5rem;
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.cancel-btn:hover {
		background-color: #e0e0e0;
	}
</style>
