<script lang="ts">
    import { groupStore } from '../../../stores/groupStore';
    import { errorToast } from '../../../utils/toast';
    import type { Group } from '../../../types/groups';
    
    export let group: Group;
    export let onClose: () => void;
    export let getRandomColor: (username: string) => string;
    export let getInitial: (username: string) => string;
    
    let groupDetails: any = null;
    let isLoading = false;
    
    async function fetchGroupDetails() {
        if (!group) return;
        
        isLoading = true;
        try {
            const details = await groupStore.getGroupDetails(group.group_id);
            if (details) {
                groupDetails = details;
            }
        } catch (error) {
            errorToast(error instanceof Error ? error.message : 'Unknown error');
        } finally {
            isLoading = false;
        }
    }
    
    async function handleLeaveGroup() {
        try {
            const success = await groupStore.leaveGroup(group.group_id);
            if (success) {
                onClose();
            }
        } catch (error) {
            errorToast(error instanceof Error ? error.message : 'Unknown error');
        }
    }
    
    // Fetch group details when modal opens
    $: if (group && !groupDetails) {
        fetchGroupDetails();
    }
</script>

<div class="modal-overlay">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Group Details</h3>
            <button class="close-btn" on:click={onClose}>×</button>
        </div>
        
        <div class="modal-body">
            {#if isLoading}
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p class="loading-text">Loading group details...</p>
                </div>
            {:else if groupDetails}
                <div class="group-details">
                    <div class="group-header">
                        <div class="group-avatar"
                             style="background-color: {groupDetails.group_colour || getRandomColor('Group')}">
                            {getInitial(groupDetails.group_name || 'G')}
                        </div>
                        <div class="group-info">
                            <h4>{groupDetails.group_name}</h4>
                            <p class="group-description">{groupDetails.group_description || 'No description'}</p>
                        </div>
                    </div>
                    
                    <div class="group-meta">
                        <p><strong>Members:</strong> {groupDetails.user_ids.length}</p>
                        <p><strong>Admins:</strong> {groupDetails.admin_ids.length}</p>
                        <p><strong>Private:</strong> {groupDetails.private ? 'Yes' : 'No'}</p>
                    </div>
                </div>
            {:else}
                <p class="no-details">Unable to load group details.</p>
            {/if}
        </div>
        
        <div class="modal-footer">
            <button class="leave-btn" on:click={handleLeaveGroup}>Leave Group</button>
            <button class="close-btn" on:click={onClose}>Close</button>
        </div>
    </div>
</div>

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1001;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #333;
    }
    
    .close-btn {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    }
    
    .close-btn:hover {
        color: #333;
    }
    
    .modal-body {
        padding: 1rem;
        min-height: 150px;
    }
    
    .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: #0b9476;
        animation: spin 1s ease-in-out infinite;
    }
    
    .loading-text {
        color: #666;
        font-style: italic;
    }
    
    .group-details {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    
    .group-header {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .group-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1.5rem;
    }
    
    .group-info h4 {
        margin: 0;
        color: #333;
    }
    
    .group-description {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.9rem;
    }
    
    .group-meta {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #666;
    }
    
    .no-details {
        text-align: center;
        color: #666;
        font-style: italic;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1rem;
        border-top: 1px solid #eee;
    }
    
    .leave-btn {
        padding: 0.5rem 1rem;
        background-color: #e74c3c;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .leave-btn:hover {
        background-color: #c0392b;
    }
    
    .close-btn {
        padding: 0.5rem 1rem;
        background-color: #f5f5f5;
        color: #333;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .close-btn:hover {
        background-color: #e0e0e0;
    }
    
    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>