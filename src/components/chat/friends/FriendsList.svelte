<script lang="ts">
	import { friendStore } from '$lib/stores/friendStore';
	import { errorToast } from '$lib/utils/toast';
	import FriendDetailModal from './FriendDetailModal.svelte';
	import type { Friend } from '$lib/types/friend';
	import { getInitial, getRandomColour } from '$lib/utils/groupUtils';
	import { getTextColourForBackground } from '$lib/utils/colourUtils';
	import { fr } from 'zod/locales';

	let selectedFriend: Friend | null = null;
	let showDetailModal = false;

	async function handleAcceptFriend(friendId: number) {
		try {
			const store = friendStore as any;
			if (store.acceptFriendRequest) {
				const success = await store.acceptFriendRequest(friendId);
				if (!success) {
					errorToast('Failed to accept friend request');
				}
			} else {
				errorToast('acceptFriendRequest method not found');
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleRejectFriend(friendId: number) {
		try {
			const store = friendStore as any;
			if (store.rejectFriendRequest) {
				const success = await store.rejectFriendRequest(friendId);
				if (!success) {
					errorToast('Failed to reject friend request');
				}
			} else {
				errorToast('rejectFriendRequest method not found');
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	async function handleCancelFriendRequest(friendId: number) {
		try {
			const store = friendStore as any;
			if (store.cancelFriendRequest) {
				const success = await store.cancelFriendRequest(friendId);
				if (!success) {
					errorToast('Failed to cancel friend request');
				}
			} else {
				errorToast('cancelFriendRequest method not found');
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function getBackgroundColor(friend: Friend) {
		return friend.user?.colour || getRandomColour();
	}

	function handleFriendClick(friend: Friend) {
		console.log('Friend clicked:', friend);
		selectedFriend = friend;
		showDetailModal = true;
	}

	function stopAndAccept(e: MouseEvent, friendId: number) {
		e.stopPropagation();
		handleAcceptFriend(friendId);
	}

	function stopAndReject(e: MouseEvent, friendId: number) {
		e.stopPropagation();
		handleRejectFriend(friendId);
	}

	function stopAndCancel(e: MouseEvent, friendId: number) {
		e.stopPropagation();
		handleCancelFriendRequest(friendId);
	}
</script>

<div class="friends-list">
	{#if $friendStore.friends.length > 0}

		{#if $friendStore.friends.some((f) => f.accepted === false && f.user)}
			<div class="section-label top">Incoming friend requests</div>
			{#each $friendStore.friends as friend (friend.friend_id)}
				{#if friend.accepted === false && friend.user}
					<div
						class="friend-item incoming"
						style="--bg: {getBackgroundColor(friend)}; --text: {getTextColourForBackground(getBackgroundColor(friend))}"
						role="button"
						tabindex="0"
						aria-label="View details for {friend.user?.username || 'Unknown User'}"
						onclick={() => handleFriendClick(friend)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFriendClick(friend); }}
					>
						<div class="indicator"></div>
						<div class="avatar">
							{#if friend.user?.avatar}
								<img src={friend.user.avatar} alt={friend.user.username} />
							{:else}
								<span class="initial">{getInitial(friend.user?.username || '')}</span>
							{/if}
						</div>
						<div class="info">
							<span class="username">{friend.user?.username || 'Unknown User'}</span>
							<span class="status">⏳ Incoming Request</span>
						</div>
						<div class="actions">
							<button class="btn accept" onclick={(e) => stopAndAccept(e, friend.friend_id)}>✓ Accept</button>
							<button class="btn reject" onclick={(e) => stopAndReject(e, friend.friend_id)}>✗ Reject</button>
						</div>
					</div>
				{/if}
			{/each}
		{/if}

		{#if $friendStore.friends.some((f) => f.accepted === null)}
			<div class="section-label {$friendStore.friends.some((f) => f.accepted === false && f.user) ? 'with-border' : 'top'}">Pending requests</div>
			{#each $friendStore.friends as friend (friend.friend_id)}
				{#if friend.accepted === null}
					<div
						class="friend-item pending"
						style="--bg: {getBackgroundColor(friend)}; --text: {getTextColourForBackground(getBackgroundColor(friend))}"
						role="button"
						tabindex="0"
						aria-label="View details for {friend.user?.username || 'Pending Request'}"
						onclick={() => handleFriendClick(friend)}
						onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFriendClick(friend); }}
					>
						<div class="indicator"></div>
						<div class="avatar">
							{#if friend.user?.avatar}
								<img src={friend.user.avatar} alt={friend.user?.username || 'Pending'} />
							{:else}
								<span class="initial">{getInitial(friend.user?.username || 'P')}</span>
							{/if}
						</div>
						<div class="info">
							<span class="username">{friend.user?.username || 'Pending Request'}</span>
							<span class="status">⏳ Waiting for response...</span>
						</div>
						<div class="actions">
							<button class="btn cancel" onclick={(e) => stopAndCancel(e, friend.friend_id)}>✗ Cancel</button>
						</div>
					</div>
				{/if}
			{/each}
		{/if}

		{#if ($friendStore.friends.some((f) => f.accepted === false && f.user) || $friendStore.friends.some((f) => f.accepted === null)) && $friendStore.friends.some((f) => f.accepted === true && f.user)}
			<div class="section-label with-border">Your Friends</div>
		{/if}

		{#each $friendStore.friends as friend (friend.friend_id)}
			{#if friend.accepted === true && friend.user}
				<div
					class="friend-item accepted"
					style="--bg: {getBackgroundColor(friend)}; --text: {getTextColourForBackground(getBackgroundColor(friend))}"
					role="button"
					tabindex="0"
					aria-label="View details for {friend.user.username}"
					onclick={() => handleFriendClick(friend)}
					onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleFriendClick(friend); }}
				>
					<div class="avatar">
						{#if friend.user?.avatar}
							<img src={friend.user.avatar} alt={friend.user.username} />
						{:else}
							<span class="initial">{getInitial(friend.user?.username || '')}</span>
						{/if}
					</div>
					<div class="info">
						<span class="username">{friend.user?.username || 'Unknown User'}</span>
						<span class="status">✓ Friends</span>
					</div>
				</div>
			{/if}
		{/each}

	{:else}
		<p class="no-friends">You don't have any friends yet. Add some friends to get started!</p>
	{/if}
</div>

{#if showDetailModal && selectedFriend}
	<FriendDetailModal friend={selectedFriend} onClose={() => (showDetailModal = false)} />
{/if}

<style>
	.friends-list {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 1.5rem;
		width: 100%;
	}

	.section-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #7f8c8d;
		letter-spacing: 0.05em;
		padding: 0.25rem 0;
	}
	.section-label.top {
		margin-top: 0.25rem;
	}
	.section-label.with-border {
		margin-top: 1rem;
		padding-top: 0.75rem;
		border-top: 1px solid #eee;
	}

	.friend-item {
		position: relative;
		display: flex;
		align-items: center;
		background: var(--bg);
		border-radius: 12px;
		padding: 0.7rem 0.85rem;
		gap: 0.75rem;
		cursor: pointer;
		overflow: hidden;
	}
	.friend-item:hover {
		filter: brightness(0.92);
	}
	.friend-item:focus-visible {
		outline: 3px solid rgba(255, 255, 255, 0.6);
		outline-offset: 2px;
	}

	.indicator {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6px;
	}
	.incoming .indicator {
		background: #27ae60;
	}
	.pending .indicator {
		background: #f39c12;
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
	.username {
		color: var(--text);
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.status {
		color: var(--text);
		font-size: 0.75rem;
	}
	.actions {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}
	.btn {
		padding: 0.35rem 0.7rem;
		border: none;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		color: white;
		white-space: nowrap;
	}
	.btn:hover {
		filter: brightness(0.85);
	}
	.accept { background: #27ae60; }
	.reject { background: #e74c3c; }
	.cancel { background: #f39c12; }

	.no-friends {
		text-align: center;
		padding: 2rem;
		color: #7f8c8d;
		font-style: italic;
	}
</style>