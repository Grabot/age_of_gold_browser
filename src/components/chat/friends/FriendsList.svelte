<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";
	
	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;
</script>

<div class="friends-list">
	<h3>Your Friends</h3>
	<ul>
		{#each $friendStore.friends as friend (friend.friend_id)}
			<li>
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
						<span class="status">
							{friend.accepted ? '✓ Friends' : '⏳ Pending'}
						</span>
					</div>
				</div>
			</li>
		{/each}
	</ul>
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
</style>