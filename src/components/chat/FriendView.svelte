<script lang="ts">
	import AddFriend from "./friends/AddFriend.svelte";
	import FriendsList from "./friends/FriendsList.svelte";
	import FriendRequests from "./friends/FriendRequests.svelte";
	import { onMount } from 'svelte';

	export let onClose: () => void;

	let activeTab: 'friends' | 'requests' | 'add' = 'friends';
	let searchQuery: string = '';
	let searchResult: { id: number; username: string } | null = null;
	let searchResultAvatar: string | null = null;
	let searched = false;
	let lastSearchedQuery: string | null = null;
	let isLoading = false;
	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function setActiveTab(tab: 'friends' | 'requests' | 'add') {
		activeTab = tab;
		searchQuery = '';
		searchResult = null;
		searchResultAvatar = null;
		searched = false;
		lastSearchedQuery = null;
		isLoading = false;
	}

	function getRandomColor(username: string): string {
		let hash = 0;
		for (let i = 0; i < username.length; i++) {
			hash = username.charCodeAt(i) + ((hash << 5) - hash);
		}
		const hue = Math.abs(hash) % 360;
		return `hsl(${hue}, 70%, 50%)`;
	}

	function getInitial(username: string): string {
		return username.charAt(0).toUpperCase();
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
			<h2>Friends</h2>
			<button class="close-btn" on:click={onClose}>x</button>
		</div>

		<div class="tabs">
			<button
				class={activeTab === 'friends' ? 'active' : ''}
				on:click={() => setActiveTab('friends')}
			>
				Friends
			</button>
			<button
				class={activeTab === 'requests' ? 'active' : ''}
				on:click={() => setActiveTab('requests')}
			>
				Requests
			</button>
			<button
				class={activeTab === 'add' ? 'active' : ''}
				on:click={() => setActiveTab('add')}
			>
				Add New
			</button>
		</div>

		<div class="tab-content">
			{#if activeTab === 'friends'}
				<FriendsList {getRandomColor} {getInitial} />
			{:else if activeTab === 'requests'}
				<FriendRequests {getRandomColor} {getInitial} />
			{:else if activeTab === 'add'}
				<AddFriend
					{getRandomColor}
					{getInitial}
					bind:searchQuery
					bind:searchResult
					bind:searchResultAvatar
					bind:searched
					bind:lastSearchedQuery
					bind:isLoading
				/>
			{/if}
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
		z-index: 1000;
	}

	.modal-content {
		background: white;
		width: 80%;
		height: 70%;
		max-width: 800px;
		max-height: 600px;
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

	.modal-header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
	}

	.tabs {
		display: flex;
		border-bottom: 1px solid #eee;
	}

	.tabs button {
		flex: 1;
		padding: 1rem;
		background: none;
		border: none;
		font-size: 1rem;
		color: #666;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}

	.tabs button.active {
		color: #0b9476;
		border-bottom-color: #0b9476;
		font-weight: 500;
	}

	.tab-content {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
	}

</style>
