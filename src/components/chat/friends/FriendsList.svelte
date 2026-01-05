<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";
	import { errorToast } from "../../../utils/toast";
	import FriendDetailModal from "./FriendDetailModal.svelte";
	import type { Friend } from "../../../types/user";
	
	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;
	
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
</script>

<div class="friends-list">
	{#if $friendStore.friends.length > 0}
        <!-- Incoming friend requests section (accepted === false) -->
        {#each $friendStore.friends as friend (friend.friend_id)}
            {#if friend.accepted === false && friend.user}
                <li class="friend-request incoming" on:click={() => { selectedFriend = friend; showDetailModal = true; }}>
                    <div class="friend-item">
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
                                    style="background-color: {getRandomColor(friend.user?.username || '')}"
                                >
                                    {getInitial(friend.user?.username || '')}
                                    </div>
                            {/if}
                        </div>
                        <div class="friend-info">
                            <span class="username">{friend.user?.username || 'Unknown User'}</span>
                            <span class="status">⏳ Incoming Request</span>
                        </div>
                            <div class="request-actions">
                            <button class="accept-btn" on:click|stopPropagation={() => handleAcceptFriend(friend.friend_id)}>✓ Accept</button>
                            <button class="reject-btn" on:click|stopPropagation={() => handleRejectFriend(friend.friend_id)}>✗ Reject</button>
                        </div>
                    </div>
                </li>
            {/if}
        {/each}
        
        <!-- Pending friend requests (sent by current user, accepted === null) -->
        {#each $friendStore.friends as friend (friend.friend_id)}
            {#if friend.accepted === null}
                <li class="friend-request pending" on:click={() => { selectedFriend = friend; showDetailModal = true; }}>
                    <div class="friend-item">
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
                                    style="background-color: {getRandomColor(friend.user?.username || 'Pending')}"
                                >
                                    {getInitial(friend.user?.username || 'P')}
                                    </div>
                            {/if}
                        </div>
                        <div class="friend-info">
                            <span class="username">{friend.user?.username || 'Pending Request'}</span>
                            <span class="status">⏳ Waiting for response...</span>
                        </div>
                        <div class="request-actions">
                            <button class="cancel-btn" on:click|stopPropagation={() => handleCancelFriendRequest(friend.friend_id)}>✗ Cancel</button>
                        </div>
                    </div>
                </li>
            {/if}
        {/each}
        
        <!-- Friend Detail Modal -->
        {#if showDetailModal && selectedFriend}
            <FriendDetailModal
                friend={selectedFriend}
                onClose={() => showDetailModal = false}
                {getRandomColor}
                {getInitial}
            />
        {/if}
        
        <!-- Separator between requests and accepted friends -->
        {#if ($friendStore.friends.filter(f => f.accepted === false && f.user).length > 0 || 
              $friendStore.friends.filter(f => f.accepted === null).length > 0) && 
              $friendStore.friends.filter(f => f.accepted === true && f.user).length > 0}
            <div class="section-separator">
                <span>Your Friends</span>
            </div>
        {/if}
		
        <!-- Accepted friends section -->
        {#each $friendStore.friends as friend (friend.friend_id)}
            {#if friend.accepted === true && friend.user}
                <li class="friend-accepted" on:click={() => { selectedFriend = friend; showDetailModal = true; }}>
                    <div class="friend-item">
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
                                    style="background-color: {getRandomColor(friend.user?.username || '')}"
                                >
                                    {getInitial(friend.user?.username || '')}
                                    </div>
                            {/if}
                        </div>
                        <div class="friend-info">
                            <span class="username">{friend.user?.username || 'Unknown User'}</span>
                            <span class="status">✓ Friends</span>
                        </div>
                    </div>
                </li>
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
		gap: 0.5rem;
	}

	.friends-list h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.friends-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.friends-list li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background-color 0.2s;
	}

	.friends-list li:hover {
		background-color: #f5f5f5;
	}

	.friend-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.avatar-container {
		width: 40px;
		height: 40px;
		overflow: hidden;
		flex-shrink: 0;
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
	}

	.friend-avatar.placeholder {
		background-color: inherit;
	}

	.friend-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.username {
		font-weight: 600;
		color: #333;
	}

    .status {
        font-size: 0.8rem;
        color: #666;
    }

    /* Friend request styles */
    .friend-request {
        border-left: 3px solid #f39c12;
        background-color: #fff9f0;
    }

    .friend-request.incoming {
        border-left-color: #27ae60;
        background-color: #f0fff7;
    }

    .friend-request.pending {
        border-left-color: #f39c12;
        background-color: #fff9f0;
    }

    .friend-accepted {
        border-left: 3px solid transparent;
    }

    .request-actions {
        display: flex;
        gap: 0.5rem;
        margin-left: auto;
    }

    .accept-btn, .reject-btn {
        padding: 0.3rem 0.7rem;
        border: none;
        border-radius: 4px;
        font-size: 0.8rem;
        cursor: pointer;
        font-weight: 500;
    }

    .accept-btn {
        background-color: #27ae60;
        color: white;
    }

    .accept-btn:hover {
        background-color: #219653;
    }

    .reject-btn {
        background-color: #e74c3c;
        color: white;
    }

    .reject-btn:hover {
        background-color: #c0392b;
    }

    .section-separator {
        padding: 1rem 0 0.5rem 0;
        font-size: 0.9rem;
        color: #7f8c8d;
        font-weight: 500;
        border-top: 1px solid #eee;
        margin-top: 1rem;
    }

    .no-friends {
        text-align: center;
        padding: 2rem;
        color: #7f8c8d;
        font-style: italic;
    }

    .pending-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }
</style>