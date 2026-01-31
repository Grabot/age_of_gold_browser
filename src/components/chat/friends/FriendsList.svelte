<script lang="ts">
	import { friendStore } from '$lib/stores/friendStore';
	import { errorToast } from '$lib/utils/toast';
	import FriendDetailModal from './FriendDetailModal.svelte';
	import type { Friend } from '$lib/types/friend';
	import { getInitial, getRandomColour } from '$lib/utils/groupUtils';

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
</script>

<div class="friends-list">
    {#if $friendStore.friends.length > 0}
        <!-- Incoming friend requests section (accepted === false) -->
        {#if $friendStore.friends.some((f) => f.accepted === false && f.user)}
            <div class="section-separator-top">
                <span>Incoming friend requests</span>
            </div>
            {#each $friendStore.friends as friend (friend.friend_id)}
                {#if friend.accepted === false && friend.user}
					<div class="friend-item-container">
						<div
							class="friend-item incoming"
							style="--user-colour: {getBackgroundColor(friend)}"
							role="button"
							tabindex="0"
							aria-label={`View details for ${friend.user?.username || 'Unknown User'}`}
							onclick={() => {
								selectedFriend = friend;
								showDetailModal = true;
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									selectedFriend = friend;
									showDetailModal = true;
								}
							}}
						>
							<!-- Avatar on the far left -->
							<div class="avatar-container">
							{#if friend.user?.avatar}
								<img class="friend-avatar" src={friend.user.avatar} alt={friend.user.username} />
							{:else}
								<div class="friend-avatar placeholder" style="background-color: {getBackgroundColor(friend)}">
								{getInitial(friend.user?.username || '')}
								</div>
							{/if}
							</div>

							<!-- Username in the middle -->
							<div class="friend-info">
							<span class="username">{friend.user?.username || 'Unknown User'}</span>
							<span class="status">⏳ Incoming Request</span>
							</div>

							<!-- Action buttons on the right -->
							<div class="request-actions">
							<button
								class="accept-btn"
								onclick={() => handleAcceptFriend(friend.friend_id)}
							>
								✓ Accept
							</button>
							<button
								class="reject-btn"
								onclick={() => handleRejectFriend(friend.friend_id)}
							>
								✗ Reject
							</button>
							</div>
						</div>
					</div>
                {/if}
            {/each}
        {/if}

        <!-- Pending friend requests (sent by current user, accepted === null) -->
        {#if $friendStore.friends.some((f) => f.accepted === null)}
            {#if $friendStore.friends.some((f) => f.accepted === false && f.user)}
                <div class="section-separator">
                    <span>Pending requests</span>
                </div>
            {:else}
                <div class="section-separator-top">
                    <span>Pending requests</span>
                </div>
            {/if}
            {#each $friendStore.friends as friend (friend.friend_id)}
                {#if friend.accepted === null}
                    <div class="friend-item-container">
                        <div
                            class="friend-item pending"
                            style="--user-colour: {getBackgroundColor(friend)}"
                        >
                            <div class="status-tab"></div>
                            <button
                                class="friend-button"
                                onclick={() => {
                                    selectedFriend = friend;
                                    showDetailModal = true;
                                }}
                            >
                                <div class="avatar-container">
                                    {#if friend.user?.avatar}
                                        <img
                                            class="friend-avatar"
                                            src={friend.user.avatar}
                                            alt={friend.user?.username || 'Pending'}
                                        />
                                    {:else}
                                        <div
                                            class="friend-avatar placeholder pending-placeholder"
                                            style="background-color: {getBackgroundColor(friend)}"
                                        >
                                            {getInitial(friend.user?.username || 'P')}
                                        </div>
                                    {/if}
                                </div>
                                <div class="friend-info">
                                    <span class="username">{friend.user?.username || 'Pending Request'}</span>
                                    <span class="status">⏳ Waiting for response...</span>
                                </div>
                            </button>
                            <div class="request-actions">
                                <button
                                    class="cancel-btn"
                                    onclick={() => handleCancelFriendRequest(friend.friend_id)}
                                >
                                    <span>✗</span> Cancel
                                </button>
                            </div>
                        </div>
					</div>
                {/if}
            {/each}
        {/if}

        <!-- Separator between requests and accepted friends -->
        {#if ($friendStore.friends.filter((f) => f.accepted === false && f.user).length > 0 || $friendStore.friends.filter((f) => f.accepted === null).length > 0) && $friendStore.friends.filter((f) => f.accepted === true && f.user).length > 0}
            <div class="section-separator">
                <span>Your Friends</span>
            </div>
        {/if}

        <!-- Accepted friends section -->
        {#each $friendStore.friends as friend (friend.friend_id)}
            {#if friend.accepted === true && friend.user}
                <div class="friend-item-container">
                    <div
                        class="friend-item accepted"
                        style="--user-colour: {getBackgroundColor(friend)}"
                    >
                        <button
                            class="friend-button"
                            onclick={() => {
                                selectedFriend = friend;
                                showDetailModal = true;
                            }}
                        >
                            <div class="avatar-container">
                                {#if friend.user?.avatar}
                                    <img
                                        class="friend-avatar"
                                        src={friend.user.avatar}
                                        alt={friend.user.username}
                                    />
                                {:else}
                                    <div
                                        class="friend-avatar placeholder"
                                        style="background-color: {getBackgroundColor(friend)}"
                                    >
                                        {getInitial(friend.user?.username || '')}
                                    </div>
                                {/if}
                            </div>
                            <div class="friend-info">
                                <span class="username">{friend.user?.username || 'Unknown User'}</span>
                                <span class="status">✓ Friends</span>
                            </div>
                        </button>
                    </div>
				</div>
            {/if}
        {/each}
    {:else}
        <p class="no-friends">You don't have any friends yet. Add some friends to get started!</p>
    {/if}
</div>

<style>
	.friends-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1.5rem;
		width: 100%;
	}

	.friend-item-container {
		position: relative;
		width: 100%;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		background: white;
	}

	.friend-item {
		display: flex;
		align-items: left;
		text-align: left;
		width: 100%;
		background: var(--user-colour);
		color: white;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		cursor: pointer;
	}

	.friend-item:hover {
		transform: scale(1.01);
	}

	.friend-item.incoming::before,
	.friend-item.pending::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 8px;
		border-radius: 12px 0 0 12px;
	}

	.friend-item.incoming::before {
		background: #27ae60;
	}

	.friend-item.pending::before {
		background: #f39c12;
	}

	.friend-button {
		display: flex;
		align-items: center;
		flex: 1;
		border: none;
		background: transparent;
		cursor: pointer;
		text-align: left;
		width: 100%;
		padding: 0.5rem 0;
	}

	.friend-info {
		flex: 1;
		min-width: 0;
		text-align: center;
	}

	.username {
		font-weight: 600;
		color: white;
		display: block;
		width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.status {
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.8);
		text-align: center;
		display: block;
		width: 100%;
	}

	.avatar-container {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
		margin-right: 1rem;
	}

	.friend-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 1rem;
		border-radius: 50%;
	}

	.friend-avatar.placeholder {
		background-color: inherit;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
	}

	.request-actions {
		pointer-events: none;
	}

	.request-actions > * {
		pointer-events: auto;
	}

	.accept-btn,
	.reject-btn,
	.cancel-btn {
		padding: 0.4rem 0.8rem;
		border: none;
		border-radius: 6px;
		font-size: 0.8rem;
		cursor: pointer;
		font-weight: 500;
		pointer-events: auto;
	}

	.accept-btn {
		background-color: #27ae60;
  		color: white;
	}

	.accept-btn:hover {
		background-color: #219653;
  		color: white;
	}

	.reject-btn {
		background-color: #e74c3c;
  		color: white;
	}

	.reject-btn:hover {
		background-color: #c0392b;
	}

	.cancel-btn {
		background-color: #ff9800;
	}

	.cancel-btn:hover {
		background-color: #e68a00;
	}

	.section-separator {
		padding: 1rem 0 0.5rem 0;
		font-size: 0.9rem;
		color: #7f8c8d;
		font-weight: 500;
		border-top: 1px solid #eee;
		margin-top: 1rem;
		text-align: center;
	}

	.section-separator-top {
		font-size: 0.9rem;
		color: #7f8c8d;
		font-weight: 500;
		text-align: center;
		margin: 1rem 0 0.5rem;
	}

	.no-friends {
		text-align: center;
		padding: 2rem;
		color: #7f8c8d;
		font-style: italic;
	}
	/* Ensure the friend item fills the container and buttons are inside */
	.friend-item-container > .friend-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem;
	}

	/* Fix layout for accepted friends (no tab) */
	.friend-item.accepted {
		border-left: none;
	}
</style>
