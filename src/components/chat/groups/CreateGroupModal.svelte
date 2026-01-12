<script lang="ts">
    import { groupStore } from '../../../stores/groupStore';
    import { friendStore } from '../../../stores/friendStore';
    import { errorToast, successToast } from '../../../utils/toast';
	import { onMount } from 'svelte';
	import { authStore } from '../../../stores/authStore';
    
    export let onClose: () => void;
    
    let myUserId: number | null = null;
    let groupName: string = '';
    let groupDescription: string = '';
    let groupColour: string = '#0b9476';
    let selectedFriends: number[] = [];
    
    // Get available friends (accepted friends only)
    $: availableFriends = $friendStore.friends.filter(f => f.accepted === true && f.user);
    
    function handleOverlayClick(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            onClose();
        }
    }
    
    onMount(async () => {
        authStore.subscribe((state) => {
			if (state.isAuthenticated && state.user) {
                console.log("User is authenticated, getting id"); 
                myUserId = state.user.id;
                console.log(myUserId);
            } else {
                console.log('User is not authenticated');
			}
        });
    });
    
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
        if (myUserId == null) {
            errorToast('User not authenticated');
            return;
        }
        
        try {
            const success = await groupStore.createGroup({
                groupName: groupName.trim(),
                groupDescription: groupDescription.trim(),
                groupColour: groupColour,
                friendIds: selectedFriends,
                meId: myUserId
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
    aria-label="Create Group"
>
    <div class="modal-content">
        <div class="modal-header">
            <h2>Create New Group</h2>
            <button class="close-btn" on:click={onClose}>x</button>
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