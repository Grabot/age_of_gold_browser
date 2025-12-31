<script lang="ts">
	import { handleSearchFriend } from "../../../services/friendsService";
	import { handleGetAvatar } from "../../../services/settingsService";
	import { accessTokenValue } from "../../../stores/authStore";
	import { friendStore } from "../../../stores/friendStore";
	import { errorToast } from "../../../utils/toast";

	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;
	
	export let searchQuery: string;
	export let searchResult: { id: number; username: string } | null;
	export let searchResultAvatar: string | null;
	export let searched: boolean;
	export let lastSearchedQuery: string | null;
	export let isLoading: boolean;

	async function handleSearch() {
		if (searchQuery) {
			const accessToken = $accessTokenValue;
			if (accessToken) {
				isLoading = true;
				searchResult = null;
				searchResultAvatar = null;
				searched = false;

				try {
					const response = await handleSearchFriend(accessToken, searchQuery);
					if (response.success && response.data) {
						searchResult = response.data as { id: number; username: string };
						const avatarResponse = await handleGetAvatar(accessToken, searchResult.id, false);
						if (avatarResponse.success && avatarResponse.avatar) {
							searchResultAvatar = avatarResponse.avatar;
						}
					} else {
						lastSearchedQuery = searchQuery;
						searched = true;
					}
				} finally {
					isLoading = false;
				}
			}
		}
	}

	async function handleAddFriend() {
		if (searchResult != null) {
			const friendData = {
				id: searchResult.id,
				username: searchResult.username,
				avatar: searchResultAvatar || undefined
			};
			
			const success = await friendStore.sendFriendRequest(searchResult.id, friendData);
			
			if (success) {
				searchResult = null;
				searchResultAvatar = null;
				searched = false;
				searchQuery = '';
			}
		}
	}
</script>

<div class="add-friend">
	<h3>Add New Friend</h3>
	<div class="search-box">
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search by name..."
			disabled={isLoading}
		/>
		<button 
			class="search-btn"
			on:click={handleSearch}
			disabled={isLoading || !searchQuery || searchQuery === lastSearchedQuery}
		>
			{isLoading ? 'Searching...' : 'Search'}
		</button>
	</div>

	{#if searchResult}
		<div class="search-result">
			<div class="friend-avatar">
				{#if searchResultAvatar}
					<img src={searchResultAvatar} alt="Profile" />
				{:else}
					<div 
						class="friend-avatar-placeholder"
						style="background-color: {getRandomColor(searchResult.username)}"
					>
						{getInitial(searchResult.username)}
					</div>
				{/if}
			</div>
			<div class="friend-info">
				<div class="username">{searchResult.username}</div>
				<button 
					class="add-btn"
					on:click={handleAddFriend}
					disabled={isLoading}
				>
					Add Friend
				</button>
			</div>
		</div>
	{/if}

	{#if searched && !searchResult}
		<div class="no-results">
			<p>No user found with that name.</p>
		</div>
	{/if}
</div>

<style>
	.add-friend {
		padding: 1rem;
		background: white;
		border-radius: 8px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.add-friend h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.search-box {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.search-box input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
	}

	.search-btn {
		padding: 0.75rem 1.5rem;
		background: #0b9476;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.search-btn:hover:not(:disabled) {
		background: #098567;
	}

	.search-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.search-result {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 8px;
		margin-top: 1rem;
	}

	.friend-info {
		flex: 1;
	}

	.username {
		font-weight: 600;
		color: #333;
		margin-bottom: 0.5rem;
	}

	.add-btn {
		background: #0b9476;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.add-btn:hover:not(:disabled) {
		background: #098567;
	}

	.add-btn:disabled {
		background: #ccc;
		cursor: not-allowed;
	}

	.friend-avatar {
		width: 50px;
		height: 50px;
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
		font-size: 16px;
	}

	.no-results {
		padding: 1rem;
		text-align: center;
		color: #666;
		background: #f8f9fa;
		border-radius: 8px;
		margin-top: 1rem;
	}
</style>