<script lang="ts">
	import { handleSearchFriend } from '$lib/services/friendsService';
	import { handleGetAvatar } from '$lib/services/settingsService';
	import { accessTokenValue } from '$lib/stores/authStore';
	import { friendStore } from '$lib/stores/friendStore';
	import { getInitial, getRandomColour } from '$lib/utils/groupUtils';
	import { errorToast } from '$lib/utils/toast';

	export let searchQuery: string;
	export let searchResult: { id: number; username: string; colour: string } | null;
	export let searchResultAvatar: string | null;
	export let searched: boolean;
	export let lastSearchedQuery: string | null;
	export let isLoading: boolean;
	export let onClose: () => void = () => {};

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
						searchResult = response.data as { id: number; username: string, colour: string };
						const avatarResponse = await handleGetAvatar(accessToken, searchResult.id, false);
						if (avatarResponse.success && avatarResponse.avatar) {
							searchResultAvatar = avatarResponse.avatar;
						} else {
							errorToast('Failed to fetch avatar');
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
				friendId: searchResult.id,
				username: searchResult.username,
				colour: searchResult.colour,
				avatar: searchResultAvatar || undefined
			};

			const success = await friendStore.sendFriendRequest(friendData);

				if (success) {
					searchResult = null;
					searchResultAvatar = null;
					searched = false;
					searchQuery = '';
					onClose();
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
			on:keydown={(e) => e.key === 'Enter' && handleSearch()}
			disabled={isLoading}
		/>
		<button on:click={handleSearch} class="search-btn" disabled={isLoading}>
			{#if isLoading}
				<span class="loading-indicator">Searching...</span>
			{:else}
				Search
			{/if}
		</button>
	</div>

	{#if isLoading}
		<div class="loading-container">
			<div class="spinner"></div>
			<p class="loading-text">Searching for Friends...</p>
		</div>
	{:else if searchResult}
		<div class="search-result-container">
			{#if searchResult}
				{@const result = searchResult}
				<div
					class="search-result"
					style="--user-colour: {result.colour}"
				>
					<div class="avatar-container">
						{#if searchResultAvatar}
							<img class="friend-avatar" src={searchResultAvatar} alt={result.username} />
						{:else}
							<div class="friend-avatar placeholder" style="background-color: {getRandomColour()}">
								{getInitial(result.username)}
							</div>
						{/if}
					</div>
					<span class="username">{result.username}</span>
					<button class="add-btn" on:click={handleAddFriend}>Add Friend</button>
				</div>
			{/if}
		</div>
	{:else if searched && !searchResult && lastSearchedQuery}
		<p class="no-result">No friend found with the name "{lastSearchedQuery}".</p>
	{/if}
</div>

<style>
	.add-friend {
		width: 100%;
		max-width: 300px;
		margin: 0 auto;
	}

	.search-box {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.search-box input {
		flex: 1;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.search-box input:disabled {
		background-color: #f5f5f5;
		cursor: not-allowed;
	}

    .search-btn {
        background: var(--primary-colour);
        color: var(--text-colour-on-primary);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
    }

	.search-btn:disabled {
        background: var(--primary-colour-light);
		cursor: not-allowed;
	}

	.search-btn:hover:not(:disabled) {
		background: #095c39;
	}

	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin-top: 2rem;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid rgba(0, 0, 0, 0.1);
		border-radius: 50%;
        border-top-color: var(--primary-colour);
		animation: spin 1s ease-in-out infinite;
	}

	.loading-text {
		color: #666;
		font-style: italic;
		margin: 0;
	}

	.loading-indicator {
		display: inline-block;
	}

	.search-result-container {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
	}

	.search-result {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding: 1.5rem;
		border-radius: 12px;
		background: color-mix(in srgb, var(--user-colour) 85%, white);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.search-result:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
	}



	.avatar-container {
		width: 80px;
		height: 80px;
		overflow: hidden;
	}

	.friend-avatar {
		width: 100%;
		height: 100%;
		object-fit: cover;
		color: var(--text-colour-on-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 2rem;
	}

	.friend-avatar.placeholder {
		background-color: inherit;
	}

	.username {
		font-size: 1.3rem;
		font-weight: 600;
		color: #333;
		margin: 0.5rem 0;
		text-align: center;
	}

	.add-btn {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		width: 100%;
		max-width: 150px;
		transition: background 0.2s ease;
	}

	.add-btn:hover {
		background: var(--primary-colour-dark);
	}
	.no-result {
		text-align: center;
		margin-top: 2rem;
		color: #666;
		font-style: italic;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
