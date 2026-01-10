<script lang="ts">
    import { groupStore } from '../../../stores/groupStore';
    import { friendStore } from '../../../stores/friendStore';
    import { errorToast, successToast } from '../../../utils/toast';
    
    export let isOpen: boolean;
    export let onClose: () => void;
    
    let groupName: string = '';
    let groupDescription: string = '';
    let groupColour: string = '#0b9476';
    let selectedFriends: number[] = [];
    
    // Get available friends (accepted friends only)
    $: availableFriends = $friendStore.friends.filter(f => f.accepted === true && f.user);
    
    function toggleFriendSelection(friendId: number) {
        if (selectedFriends.includes(friendId)) {
            selectedFriends = selectedFriends.filter(id => id !== friendId);
        } else {
            selectedFriends = [...selectedFriends, friendId];
        }
    }
    
    async function handleCreateGroup() {
        if (!groupName.trim()) {
            errorToast('Group name is required');
            return;
        }
        
        if (selectedFriends.length === 0) {
            errorToast('Please select at least one friend to create a group');
            return;
        }
        
        try {
            const success = await groupStore.createGroup({
                groupName: groupName.trim(),
                groupDescription: groupDescription.trim(),
                groupColour: groupColour,
                friendIds: selectedFriends
            });
            
            if (success) {
                successToast('Group created successfully!');
                resetForm();
                onClose();
            } else {
                errorToast('Failed to create group');
            }
        } catch (error) {
            errorToast(error instanceof Error ? error.message : 'Unknown error');
        }
    }
    
    function resetForm() {
        groupName = '';
        groupDescription = '';
        groupColour = '#0b9476';
        selectedFriends = [];
    }
    
    function closeModal() {
        resetForm();
        onClose();
    }
</script>

<div class="modal-overlay" class:open={isOpen}>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Create New Group</h3>
            <button class="close-btn" on:click={closeModal}>×</button>
        </div>
        
        <div class="modal-body">
            <div class="form-group">
                <label for="groupName">Group Name *</label>
                <input
                    type="text"
                    id="groupName"
                    bind:value={groupName}
                    placeholder="Enter group name"
                    required
                />
            </div>
            
            <div class="form-group">
                <label for="groupDescription">Group Description</label>
                <textarea
                    id="groupDescription"
                    bind:value={groupDescription}
                    placeholder="Enter group description (optional)"
                    rows="3"
                ></textarea>
            </div>
            
            <div class="form-group">
                <label for="groupColour">Group Colour</label>
                <input
                    type="color"
                    id="groupColour"
                    bind:value={groupColour}
                    class="color-picker"
                />
            </div>
            
            <div class="form-group">
                <legend>Select Friends to Add</legend>
                <div class="friends-selection">
                    {#if availableFriends.length > 0}
                        {#each availableFriends as friend (friend.friend_id)}
                            <div class="friend-item">
                                <input
                                    type="checkbox"
                                    id={`friend-${friend.friend_id}`}
                                    checked={selectedFriends.includes(friend.friend_id)}
                                    on:change={() => toggleFriendSelection(friend.friend_id)}
                                />
                                <label for={`friend-${friend.friend_id}`}>
                                    {#if friend.user}
                                        {friend.user.username}
                                    {/if}
                                </label>
                            </div>
                        {/each}
                    {:else}
                        <p class="no-friends">No friends available to add to group. Add some friends first!</p>
                    {/if}
                </div>
            </div>
        </div>
        
        <div class="modal-footer">
            <button class="cancel-btn" on:click={closeModal}>Cancel</button>
            <button class="create-btn" on:click={handleCreateGroup}>Create Group</button>
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
        z-index: 1000;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
    }
    
    .modal-overlay.open {
        opacity: 1;
        pointer-events: all;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        max-height: 80vh;
        overflow-y: auto;
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
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }
    
    .form-group input[type="text"],
    .form-group textarea {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }
    
    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }
    
    .color-picker {
        width: 50px;
        height: 50px;
        padding: 2px;
        border: 2px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .friends-selection {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #eee;
        border-radius: 4px;
        padding: 0.5rem;
    }
    
    .friend-item {
        display: flex;
        align-items: center;
        padding: 0.5rem 0;
    }
    
    .friend-item input[type="checkbox"] {
        margin-right: 0.5rem;
    }
    
    .no-friends {
        color: #666;
        font-style: italic;
        margin: 0.5rem 0;
    }
    
    .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1rem;
        border-top: 1px solid #eee;
    }
    
    .cancel-btn {
        padding: 0.5rem 1rem;
        background-color: #f5f5f5;
        color: #333;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .cancel-btn:hover {
        background-color: #e0e0e0;
    }
    
    .create-btn {
        padding: 0.5rem 1rem;
        background-color: #0b9476;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .create-btn:hover {
        background-color: #095c39;
    }
</style>