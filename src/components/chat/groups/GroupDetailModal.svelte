<script lang="ts">
    import { groupStore } from '../../../stores/groupStore';
    import { errorToast } from '../../../utils/toast';
    import type { Group } from '../../../types/groups';
    
    export let group: Group;
    export let onClose: () => void;
    export let getRandomColor: (username: string) => string;
    export let getInitial: (username: string) => string;
 
    function handleOverlayClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
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
</script>

<div
    class="modal"
    on:click={handleOverlayClick}
    on:keydown={(e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' || e.key === ' ') {
            handleOverlayClick(e as unknown as MouseEvent);
        }
    }}
    tabindex="0"
    role="dialog"
    aria-modal="true"
    aria-label="Group Details"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Group Details</h2>
            <button class="close-btn" on:click={onClose}>x</button>
        </div>
        
        <div class="modal-body">
            <div class="group-details">
                <div class="group-header">
                    <div class="group-avatar"
                            style="background-color: {group.group_colour || getRandomColor('Group')}">
                        {getInitial(group.group_name || 'G')}
                    </div>
                    <div class="group-info">
                        <h4>{group.group_name}</h4>
                        <p class="group-description">{group.group_description || 'No description'}</p>
                    </div>
                </div>
                
                <div class="group-meta">
                    <p><strong>Members:</strong> {group.user_ids.length}</p>
                    <p><strong>Admins:</strong> {group.admin_ids.length}</p>
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="leave-btn" on:click={handleLeaveGroup}>Leave Group</button>
            <button class="close-btn" on:click={onClose}>Close</button>
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
        z-index: 1001;
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
    
    .modal-body {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
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
        margin: 0;
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