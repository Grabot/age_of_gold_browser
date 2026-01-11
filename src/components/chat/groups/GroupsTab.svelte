<script lang="ts">
    import { onMount } from 'svelte';
    import { groupStore } from '../../../stores/groupStore';
    import { friendStore } from '../../../stores/friendStore';
    import CreateGroupModal from './CreateGroupModal.svelte';
    import GroupsList from './GroupsList.svelte';
    
    let showCreateGroupModal = false;
    
    // Helper functions for UI
    function getRandomColor(username: string): string {
        // Simple hash function to generate consistent colors
        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const colors = [
            '#e74c3c', '#3498db', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#d35400', '#34495e'
        ];
        
        return colors[Math.abs(hash) % colors.length];
    }
    
    function getInitial(username: string): string {
        return username.charAt(0).toUpperCase();
    }
    
    // Fetch groups when component mounts
    onMount(async () => {
        // await groupStore.fetchGroups();
    });
</script>

<div class="groups-tab">
    <div class="tab-header">
        <h3>Groups</h3>
        <button class="create-group-btn" on:click={() => showCreateGroupModal = true}>
            + Create Group
        </button>
    </div>
    
    <div class="tab-content">
        <GroupsList
            {getRandomColor}
            {getInitial}
        />
    </div>
    
    <!-- Create Group Modal -->
    {#if showCreateGroupModal}
        <CreateGroupModal
            isOpen={showCreateGroupModal}
            onClose={() => showCreateGroupModal = false}
        />
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