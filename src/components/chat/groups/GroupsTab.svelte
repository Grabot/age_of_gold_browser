<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import GroupsList from './GroupsList.svelte';
	import FloatingActionButton from '../../ui/FloatingActionButton.svelte';


	export let onCreateGroupClick: () => void = () => {};
</script>

<div class="groups-tab">
	<div class="tab-content">
		<GroupsList />
	</div>
	
	<div class="fab-container">
		<FloatingActionButton 
			onClick={onCreateGroupClick} 
			icon="👥"
			label="Create Group"
		/>
	</div>
</div>

<style>
	.groups-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
	}

	.tab-content {
		flex: 1;
		overflow-y: auto;
	}

	.groups-tab {
		display: flex;
		flex-direction: column;
		height: 100%;
		position: relative;
	}
</style>
