import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import {
    createGroup,
    fetchGroups,
    leaveGroup,
    getGroupDetails
} from '$lib/api/groupApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { Group } from '../types/groups';
import type { Chat } from '../types/user';
import { accessTokenValue } from './authStore';
import { userStore } from './userStore';

export const STORAGE_KEY_GROUPS_PREFIX = 'group_';

const initialState: GroupState = {
    groups: [],
    loading: false,
    error: null
};

interface GroupState {
    groups: Group[];
    loading: boolean;
    error: string | null;
}

function createGroupStore() {
    const { subscribe, update, set } = writable<GroupState>(initialState);

    if (typeof window !== 'undefined') {
        loadGroupsFromStorage();
    }

    function loadGroupsFromStorage() {
        const keys = Object.keys(localStorage);
        const groupKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_GROUPS_PREFIX));

        const groups: Group[] = [];

        groupKeys.forEach((key) => {
            const groupId = parseInt(key.replace(STORAGE_KEY_GROUPS_PREFIX, ''));
            const groupData = localStorage.getItem(key);
            if (groupData) {
                try {
                    const group: Group = JSON.parse(groupData);
                    groups.push(group);
                } catch (error) {
                    console.error(`Failed to parse group data for group ${groupId}:`, error);
                }
            }
        });

        update((state) => ({ ...state, groups }));
    }

    function saveGroupToStorage(group: Group) {
        if (typeof window !== 'undefined') {
            localStorage.setItem(
                `${STORAGE_KEY_GROUPS_PREFIX}${group.group_id}`,
                JSON.stringify(group)
            );
        }
    }

    function removeGroupFromStorage(groupId: number) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem(`${STORAGE_KEY_GROUPS_PREFIX}${groupId}`);
        }
    }

    return {
        subscribe,
        setGroups: (groups: Group[]) => {
            groups.forEach((group) => saveGroupToStorage(group));
            set({ groups, loading: false, error: null });
        },
        createGroup: async (groupData: {
            groupName: string;
            groupDescription: string;
            groupColour: string;
            friendIds: number[];
        }): Promise<boolean> => {
            try {
                const accessToken = get(accessTokenValue);
                const response: ApiResponse = await createGroup(
                    accessToken,
                    groupData.groupName,
                    groupData.groupDescription,
                    groupData.groupColour,
                    groupData.friendIds
                );
                if (response.success) {
                    // Refresh groups list
                    await fetchGroups(accessToken);
                    return true;
                }
                return false;
            } catch (err) {
                errorToast(err instanceof Error ? err.message : 'Unknown error');
                return false;
            }
        },
        fetchGroups: async (): Promise<boolean> => {
            try {
                const accessToken = get(accessTokenValue);
                const response: ApiResponse<Group[]> = await fetchGroups(accessToken);
                if (response.success && response.data) {
                    // Update user store with any new users from groups
                    response.data.forEach((group) => {
                        if (group.chat) {
                            group.chat.user_ids.forEach((userId) => {
                                // This would typically fetch user details, but for now we'll just ensure they're in the store
                                userStore.getUser(userId);
                            });
                        }
                    });
                    
                    // Save groups to storage and update store
                    response.data.forEach((group) => saveGroupToStorage(group));
                    set({ groups: response.data, loading: false, error: null });
                    return true;
                }
                return false;
            } catch (err) {
                errorToast(err instanceof Error ? err.message : 'Unknown error');
                return false;
            }
        },
        leaveGroup: async (groupId: number): Promise<boolean> => {
            try {
                const accessToken = get(accessTokenValue);
                const response: ApiResponse = await leaveGroup(accessToken, groupId);
                if (response.success) {
                    // Remove group from local storage and store
                    removeGroupFromStorage(groupId);
                    update((state) => {
                        const updatedGroups = state.groups.filter((g) => g.group_id !== groupId);
                        return { ...state, groups: updatedGroups };
                    });
                    return true;
                }
                return false;
            } catch (err) {
                errorToast(err instanceof Error ? err.message : 'Unknown error');
                return false;
            }
        },
        getGroupDetails: async (groupId: number): Promise<Chat | null> => {
            try {
                const accessToken = get(accessTokenValue);
                const response: any = await getGroupDetails(accessToken, groupId);
                if (response.success && response.data) {
                    return response.data;
                }
                return null;
            } catch (err) {
                errorToast(err instanceof Error ? err.message : 'Unknown error');
                return null;
            }
        },
        updateGroup: (group: Group): void => {
            saveGroupToStorage(group);
            update((state) => {
                const newGroups = state.groups.filter((g) => g.group_id !== group.group_id);
                return { ...state, groups: [...newGroups, group] };
            });
        },
        getStoredGroup: (groupId: number): Group | null => {
            const groupData = localStorage.getItem(`${STORAGE_KEY_GROUPS_PREFIX}${groupId}`);
            if (groupData) {
                try {
                    return JSON.parse(groupData) as Group;
                } catch (error) {
                    console.error(`Failed to parse stored group data for group ${groupId}:`, error);
                    return null;
                }
            }
            return null;
        },
        clear: () => {
            set(initialState);
            if (typeof window !== 'undefined') {
                const keys = Object.keys(localStorage);
                const groupKeys = keys.filter((key) => key.startsWith(STORAGE_KEY_GROUPS_PREFIX));
                groupKeys.forEach((key) => localStorage.removeItem(key));
            }
        }
    };
}

export const groupStore = createGroupStore();