import { writable, get } from 'svelte/store';
import { errorToast } from '../utils/toast';
import {
	createGroup,
	leaveGroup,
	addGroupMember,
	removeGroupMember,
	promoteAdmin,
	updateGroup,
	muteGroup,
	type CreateGroupResponse
} from '$lib/api/groupApi';
import type { ApiResponse } from '$lib/api/apiClient';
import type { Group } from '../types/groups';
import { accessTokenValue } from './authStore';

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
					console.log("GroupData");
					console.log(groupData);
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
		// Only store group data without avatar
		const GroupToStore: Group = {
			group_id: group.group_id,
			unread_messages: group.unread_messages,
			mute: group.mute,
			mute_timestamp: group.mute_timestamp,
			group_version: group.group_version,
			message_version: group.message_version,
			avatar_version: group.avatar_version,
			last_message_read_id: group.last_message_read_id,
			user_ids: group.user_ids,
			admin_ids: group.admin_ids,
			group_name: group.group_name,
			private: group.private,
			group_description: group.group_description,
			group_colour: group.group_colour,
			current_message_id: group.current_message_id,
		};// Save everything but the avatar
		if (typeof window !== 'undefined') {
			localStorage.setItem(`${STORAGE_KEY_GROUPS_PREFIX}${group.group_id}`, JSON.stringify(GroupToStore));
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
			meId: number;
		}): Promise<boolean> => {
			try {
				console.log('Starting group creation process');
				const accessToken = get(accessTokenValue);
				console.log('Access token retrieved:', accessToken);
				console.log('Group data:', groupData);
				const response: CreateGroupResponse = await createGroup(
					accessToken,
					groupData.groupName,
					groupData.groupDescription,
					groupData.groupColour,
					groupData.friendIds
				);
				console.log('Response from createGroup:', response);
				if (response.success) {
					const group: Group = {
						group_id: response.data,
						unread_messages: 0,
						mute: false,
						mute_timestamp: null,
						group_version: 0,
						message_version: 0,
						avatar_version: 0,
						last_message_read_id: 0,
						user_ids: [...groupData.friendIds, groupData.meId],
						admin_ids: [groupData.meId],
						group_name: groupData.groupName,
						private: false,
						group_description: groupData.groupDescription,
						group_colour: groupData.groupColour,
						current_message_id: 1
					};
					console.log('Group object created:', group);
					groupStore.updateGroup(group);
					console.log('Group saved to storage');
					return true;
				}
				console.log('Group creation not successful');
				return false;
			} catch (err) {
				console.error('Error during group creation:', err);
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
		addGroupMember: async (groupId: number, userId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await addGroupMember(accessToken, groupId, userId);
				if (response.success) {
					// Update the group in local storage and store
					const group = groupStore.getStoredGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							user_ids: [...group.user_ids, userId]
						};
						saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.group_id !== groupId);
							return { ...state, groups: [...newGroups, updatedGroup] };
						});
					}
					return true;
				}
				return false;
			} catch (err) {
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		removeGroupMember: async (groupId: number, userId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await removeGroupMember(accessToken, groupId, userId);
				if (response.success) {
					// Update the group in local storage and store
					const group = groupStore.getStoredGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							user_ids: group.user_ids.filter((id) => id !== userId),
							admin_ids: group.admin_ids.filter((id) => id !== userId)
						};
						saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.group_id !== groupId);
							return { ...state, groups: [...newGroups, updatedGroup] };
						});
					}
					return true;
				}
				return false;
			} catch (err) {
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		promoteAdmin: async (groupId: number, userId: number, isAdmin: boolean): Promise<boolean> => {
			try {
				console.log('promoting admin');
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await promoteAdmin(accessToken, groupId, userId, isAdmin);
				if (response.success) {
					// Update the group in local storage and store
					const group = groupStore.getStoredGroup(groupId);
					if (group) {
						let updatedAdminIds = [...group.admin_ids];
						if (isAdmin) {
							// Add to admins if not already there
							if (!updatedAdminIds.includes(userId)) {
								updatedAdminIds.push(userId);
							}
						} else {
							// Remove from admins
							updatedAdminIds = updatedAdminIds.filter((id) => id !== userId);
						}

						const updatedGroup: Group = {
							...group,
							admin_ids: updatedAdminIds
						};
						saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.group_id !== groupId);
							return { ...state, groups: [...newGroups, updatedGroup] };
						});
					}
					return true;
				}
				return false;
			} catch (err) {
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		updateGroupDetails: async (
			groupId: number,
			groupName: string | null = null,
			groupDescription: string | null = null,
			groupColour: string | null = null
		): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await updateGroup(
					accessToken,
					groupId,
					groupName,
					groupDescription,
					groupColour
				);
				if (response.success) {
					// Update the group in local storage and store
					const group = groupStore.getStoredGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							group_name: groupName !== null ? groupName : group.group_name,
							group_description:
								groupDescription !== null ? groupDescription : group.group_description,
							group_colour: groupColour !== null ? groupColour : group.group_colour
						};
						saveGroupToStorage(updatedGroup);
						update((state) => {
							const oldGroup = state.groups.find((g) => g.group_id === groupId);
							if (!oldGroup) {
								return { ...state, groups:[...state.groups, updatedGroup]}
							} else {
								oldGroup.group_name = updatedGroup.group_name;
								oldGroup.group_description = updatedGroup.group_description;
								oldGroup.group_colour = updatedGroup.group_colour;
								return { ...state, groups: [...state.groups] };
							}
						});
					}
					return true;
				}
				return false;
			} catch (err) {
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		muteGroup: async (
			groupId: number,
			mute: boolean,
			muteDurationHours: number | null = null
		): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await muteGroup(
					accessToken,
					groupId,
					mute,
					muteDurationHours
				);
				if (response.success) {
					// Update the group in local storage and store
					const group = groupStore.getStoredGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							mute: mute,
							mute_timestamp:
								mute && muteDurationHours
									? new Date(Date.now() + muteDurationHours * 60 * 60 * 1000).toISOString()
									: null
						};
						saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.group_id !== groupId);
							return { ...state, groups: [...newGroups, updatedGroup] };
						});
					}
					return true;
				}
				return false;
			} catch (err) {
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return false;
			}
		},
		updateGroup: (group: Group): void => {
			saveGroupToStorage(group);
			update((state) => {
				const newGroups = state.groups.filter((g) => g.group_id !== group.group_id);
				return { ...state, groups: [...newGroups, group] };
			});
		},
		// TODO: Rename to `getGroup`? To match the userstore?
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
