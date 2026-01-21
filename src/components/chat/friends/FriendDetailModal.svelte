<script lang="ts">
	import { errorToast } from '$lib/utils/toast';
	import { friendStore } from '$lib/stores/friendStore';
	import type { Friend } from '$lib/types/friend';

	export let friend: Friend;
	export let onClose: () => void;
	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

	async function handleRemoveFriend() {
		try {
			const store = friendStore as any;
			if (store.removeFriend) {
				const success = await store.removeFriend(friend.friend_id);
				if (success) {
					onClose();
				} else {
					errorToast('Failed to remove friend');
				}
			} else {
				errorToast('removeFriend method not found');
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleOverlayClick(e as unknown as MouseEvent);
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
>
	<div class="modal-content">
		<div class="modal-header">
			<h3>Friend Details</h3>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>

		<div class="friend-detail-content">
			<div class="avatar-container">
				{#if friend.user?.avatar}
					<img class="friend-avatar-large" src={friend.user.avatar} alt={friend.user.username} />
				{:else}
					<div
						class="friend-avatar-large placeholder"
						style="background-color: {getRandomColor(friend.user?.username || '')}"
					>
						{getInitial(friend.user?.username || '')}
					</div>
				{/if}
			</div>

			<div class="friend-info">
				<h2 class="friend-username">{friend.user?.username || 'Unknown User'}</h2>

				<div class="friend-status">
					{#if friend.accepted === false}
						<span class="status-badge incoming">⏳ Incoming Request</span>
					{:else if friend.accepted === null}
						<span class="status-badge pending">⏳ Request Sent</span>
					{/if}
				</div>

				<div class="friend-actions">
					{#if friend.accepted === true}
						<button class="remove-friend-btn" on:click={handleRemoveFriend}>Remove Friend</button>
					{/if}
				</div>
			</div>
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
		width: 90%;
		max-width: 500px;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.modal-header {
		background: #0b9476;
		color: white;
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.friend-detail-content {
		padding: 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.avatar-container {
		width: 120px;
		height: 120px;
		overflow: hidden;
	}

	.friend-avatar-large {
		width: 100%;
		height: 100%;
		object-fit: cover;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 3rem;
	}

	.friend-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		text-align: center;
	}

	.friend-username {
		margin: 0;
		font-size: 1.8rem;
		color: #333;
	}

	.status-badge {
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.9rem;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}

	.status-badge.incoming {
		background-color: #cce5ff;
		color: #004085;
	}

	.status-badge.pending {
		background-color: #fff3cd;
		color: #856404;
	}

	.friend-actions {
		margin-top: 1rem;
		display: flex;
		gap: 1rem;
	}

	.remove-friend-btn {
		background: #e74c3c;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
	}

	.remove-friend-btn:hover {
		background: #c0392b;
	}
</style>
