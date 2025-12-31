<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";
	import { avatarStore } from "../../../stores/avatarStore";
	import { onMount } from 'svelte';

	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

	// Track avatar store changes to force reactivity
	let avatars: Map<number, string>;

	// Subscribe to avatar store changes
	onMount(() => {
		const unsubscribe = avatarStore.subscribe((state) => {
			avatars = state.avatars;
			console.log('Avatar store updated:', state.avatars);
		});
		return unsubscribe;
	});

	// Function to get avatar for a friend - try both local and direct store access
	function getFriendAvatar(friendUserId: number): string | null {
		// Try local variable first
		let avatar = avatars ? avatars.get(friendUserId) || null : null;
		
		// If not in local variable, try direct store access (fallback)
		if (!avatar) {
			avatar = avatarStore.getAvatar(friendUserId);
		}
		
		return avatar;
	}

	// Function to fetch avatar if missing
	async function fetchAvatarIfNeeded(friendUserId: number) {
		console.log("fetching avatar if needed");
		if (!getFriendAvatar(friendUserId)) {
			console.log("avatar needed!");
			try {
				console.log(`Fetching avatar for friend ${friendUserId}`);
				const avatar = await avatarStore.getAvatarWithFetch(friendUserId);
				console.log(`Avatar fetched for friend ${friendUserId}:`, avatar ? 'success' : 'failed');
				
				// Force reactivity by updating local avatars variable
				if (avatar) {
					const updatedAvatars = new Map(avatars);
					updatedAvatars.set(friendUserId, avatar);
					avatars = updatedAvatars;
				}
			} catch (error) {
				console.error(`Failed to fetch avatar for friend ${friendUserId}:`, error);
			}
		}
	}

	// React to both friend list and avatar changes
	$: if ($friendStore.friends) {
		console.log('Friends updated:', $friendStore.friends);
		// Fetch any missing avatars
		$friendStore.friends.forEach(async (friendWithUser) => {
			await fetchAvatarIfNeeded(friendWithUser.friend.friend_id);
		});
	}

	// Also react when avatars store changes
	$: if (avatars) {
		console.log('Avatars updated:', avatars);
	}

</script>

<div class="friends-list">
	<h3>Your Friends</h3>
	<ul>
		{#each $friendStore.friends as friendWithUser (friendWithUser.friend.friend_id)}
			<li>
				<div class="friend-avatar">
					{#key getFriendAvatar(friendWithUser.friend.friend_id)}
					{#if getFriendAvatar(friendWithUser.friend.friend_id)}
						<img src={getFriendAvatar(friendWithUser.friend.friend_id)} alt="Profile" />
					{:else}
						<div 
							class="friend-avatar-placeholder"
							style="background-color: {friendWithUser.user ? getRandomColor(friendWithUser.user.username) : '#ccc'}"
						>
							{friendWithUser.user ? getInitial(friendWithUser.user.username) : '?'}
						</div>
					{/if}
					{/key}
				</div>
				<span>{friendWithUser.user ? friendWithUser.user.username : 'Unknown User'}</span>
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

	.friend-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
	}

	.friend-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
	}

	.friend-avatar-placeholder {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 14px;
	}

	.friends-list span {
		font-weight: 500;
		color: #333;
	}
</style>