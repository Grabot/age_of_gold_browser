<script lang="ts">
    import { groupStore } from '../../../stores/groupStore';
    import { errorToast } from '../../../utils/toast';
    import GroupDetailModal from './GroupDetailModal.svelte';
    import type { Group } from '../../../types/groups';
    
    export let getRandomColor: (username: string) => string;
    export let getInitial: (username: string) => string;
    
    let selectedGroup: Group | null = null;
    let showDetailModal = false;
    
    async function handleLeaveGroup(groupId: number) {
        try {
            const success = await groupStore.leaveGroup(groupId);
            if (!success) {
                errorToast('Failed to leave group');
            }
        } catch (error) {
            errorToast(error instanceof Error ? error.message : 'Unknown error');
        }
    }
</script>

<div class="groups-list">
    {#if $groupStore.groups.length > 0}
        <div class="section-separator-top">
            <span>Your Groups</span>
        </div>
        {#each $groupStore.groups as group (group.group_id)}
            <div class="group-item">
                <li class="group-container">
                    <button
                        class="group-button"
                        on:click={() => {
                            selectedGroup = group;
                            showDetailModal = true;
                        }}
                        type="button"
                        aria-label="View details for group {group.group_id}"
                    >
                        <div class="group-info">
                            <div class="group-avatar placeholder"
                                 style="background-color: {group.chat?.group_colour || getRandomColor('Group')}">
                                {getInitial(group.chat?.group_name || 'G')}
                            </div>
                            <div class="group-text">
                                <span class="group-name">{group.chat?.group_name || 'Unnamed Group'}</span>
                                {#if group.unread_messages > 0}
                                    <span class="unread-badge">{group.unread_messages}</span>
                                {/if}
                            </div>
                        </div>
                    </button>
                </li>
            </div>
        {/each}
    {:else}
        <p class="no-groups">You don't have any groups yet. Create a group to get started!</p>
    {/if}

    <!-- Group Detail Modal -->
    {#if showDetailModal && selectedGroup}
        <GroupDetailModal
            group={selectedGroup}
            onClose={() => (showDetailModal = false)}
            {getRandomColor}
            {getInitial}
        />
    {/if}
</div>

<style>
    .groups-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    
    .section-separator-top {
        font-size: 0.9rem;
        color: #7f8c8d;
        font-weight: 500;
        padding: 1rem 0 0.5rem 0;
    }
    
    .group-item {
        padding: 0.5rem;
        width: 100%;
        border-radius: 8px;
        text-align: left;
    }
    
    .group-container {
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        padding: 8px 0;
    }
    
    .group-button {
        display: flex;
        align-items: center;
        width: 100%;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        text-align: left;
    }
    
    .group-info {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
    }
    
    .group-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1rem;
    }
    
    .group-text {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .group-name {
        font-weight: 600;
        color: #333;
    }
    
    .unread-badge {
        background-color: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: bold;
    }
    
    .no-groups {
        text-align: center;
        padding: 2rem;
        color: #7f8c8d;
        font-style: italic;
    }
</style>