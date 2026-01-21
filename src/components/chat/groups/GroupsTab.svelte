<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import CreateGroupModal from './CreateGroupModal.svelte';
	import GroupsList from './GroupsList.svelte';

	let showCreateGroupModal = false;
</script>

<div class="groups-tab">
	<div class="tab-header">
		<h3>Groups</h3>
		<button class="create-group-btn" on:click={() => (showCreateGroupModal = true)}>
			+ Create Group
		</button>
	</div>

	<div class="tab-content">
		<GroupsList />
	</div>

	<!-- Create Group Modal -->
	{#if showCreateGroupModal}
		<CreateGroupModal onClose={() => (showCreateGroupModal = false)} />
	{/if}
</div>

<style>
	.groups-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid #eee;
	}

	.tab-header h3 {
		margin: 0;
		color: #333;
	}

	.create-group-btn {
		background-color: #0b9476;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.create-group-btn:hover {
		background-color: #095c39;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}
</style>
