<script lang="ts">
    import AddFriend from './friends/AddFriend.svelte';
    import FriendsList from './friends/FriendsList.svelte';
    import GroupsTab from './groups/GroupsTab.svelte';
    import { groupStore } from '../../stores/groupStore';
	import { onMount } from 'svelte';
	import { avatarStore } from '../../stores/avatarStore';
	import { accessTokenValue } from '../../stores/authStore';
	import { friendStore } from '../../stores/friendStore';
	import type { Friend } from '../../types/user';
	import { userStore } from '../../stores/userStore';
	import { handleGetAvatar, handleGetAvatarVersion } from '../../services/settingsService';
	import { errorToast } from '../../utils/toast';
	import { getUser } from '$lib/api/userApi';

	export let onClose: () => void;
    export let getRandomColor: (username: string) => string;
    export let getInitial: (username: string) => string;

    let activeTab: 'friends' | 'add' | 'groups' = 'friends';
	let searchQuery: string = '';
	let searchResult: { id: number; username: string } | null = null;
	let searchResultAvatar: string | null = null;
	let searched = false;
	let lastSearchedQuery: string | null = null;
	let isLoading = false;

	async function updateUserAvatar(friend: Friend) {
		const accessToken = $accessTokenValue;
		if (accessToken && friend.user) {
			const avatarResponse = await handleGetAvatar(accessToken, friend.friend_id, false);
			if (avatarResponse.success && avatarResponse.avatar) {
				friend.user.avatar = avatarResponse.avatar;
				avatarStore.updateAvatar(friend.friend_id, avatarResponse.avatar);
				const avatarVersionResponse = await handleGetAvatarVersion(accessToken, friend.friend_id);
				if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
					friend.user.avatar_version = avatarVersionResponse.avatarVersion;
				}
				friendStore.updateFriend(friend);
				userStore.updateUser(friend.user);
				avatarStore.setShouldUpdateAvatarForUser(friend.friend_id, false);
			} else {
				errorToast('Failed to fetch avatar');
			}
		}
	}

	function checkUserAvatar(friend: Friend) {
		if (friend.user) {
			if (!friend.user.avatar) {
				const avatarUser = avatarStore.getAvatar(friend.friend_id);
				if (avatarUser) {
					friend.user.avatar = avatarUser;
					friendStore.updateFriend(friend);
					userStore.updateUser(friend.user);
				} else {
					updateUserAvatar(friend);
				}
			}
		}
	}

	async function emergencyFallback(friend: Friend) {
		const storedUser = userStore.getUser(friend.friend_id);
		if (!storedUser) {
			const accessToken = $accessTokenValue;
			if (accessToken) {
				const userDetail = await getUser(accessToken, friend.friend_id);
				friend.user = userDetail;
				checkUserAvatar(friend);
			}
		} else {
			friend.user = storedUser;
			checkUserAvatar(friend);
		}
	}

    onMount(() => {
        const unsubscribe = friendStore.subscribe((storeState) => {
            if (!storeState.loading) {
                storeState.friends.forEach(async (friend) => {
                    if (avatarStore.getShouldUpdateAvatarForUser(friend.friend_id)) {
                        updateUserAvatar(friend);
                    } else {
                        if (friend.user) {
                            checkUserAvatar(friend);
                        } else {
                            emergencyFallback(friend);
                        }
                    }
                });
            }
        });
        
        return () => unsubscribe();
    });

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

    function setActiveTab(tab: 'friends' | 'add' | 'groups') {
        activeTab = tab;
        searchQuery = '';
        searchResult = null;
        searchResultAvatar = null;
        searched = false;
        lastSearchedQuery = null;
        isLoading = false;
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
            <h2>Friends & Groups</h2>
            <button class="close-btn" on:click={onClose}>x</button>
        </div>

        <div class="tabs">
            <button
                class={activeTab === 'friends' ? 'active' : ''}
                on:click={() => setActiveTab('friends')}
            >
                Friends
            </button>

            <button class={activeTab === 'groups' ? 'active' : ''} on:click={() => setActiveTab('groups')}>
                Groups
            </button>

            <button class={activeTab === 'add' ? 'active' : ''} on:click={() => setActiveTab('add')}>
                Add New
            </button>
        </div>

        <div class="tab-content">
            {#if activeTab === 'friends'}
                <FriendsList {getRandomColor} {getInitial} />
            {:else if activeTab === 'groups'}
                <GroupsTab />
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
