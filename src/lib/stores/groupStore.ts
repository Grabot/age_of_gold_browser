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
import { avatarStore } from './avatarStore';
import { indexedDBHelper } from './indexedDBHelper';

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

	async function loadGroupsFromStorage() {
		// Try IndexedDB first
		let groups: Group[] = [];
		try {
			groups = (await indexedDBHelper.getAllGroups()) as Group[];

			groups = groups.map((group) => {
				// If no chat found, create one with the chat_id
				return { ...group };
			}) as Group[];
		} catch (error) {
			console.error('Error loading groups from IndexedDB:', error);
		}

		update((state) => ({ ...state, groups }));
	}

	async function saveGroupToStorage(group: Group) {
		// Only store group data without avatar
		const GroupToStore = {
			chat_id: group.chat_id,
			unread_messages: group.unread_messages,
			mute: group.mute,
			mute_timestamp: group.mute_timestamp,
			group_version: group.group_version,
			avatar_version: group.avatar_version,
			last_message_read_id: group.last_message_read_id,
			user_ids: group.user_ids,
			admin_ids: group.admin_ids,
			name: group.name,
			description: group.description,
			colour: group.colour,
			current_message_id: group.current_message_id
		}; // Save everything but the avatar
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveGroup(GroupToStore);
		}
	}

	async function removeGroupFromStorage(groupId: number) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeGroup(groupId);
		}
	}

	return {
		subscribe,
		setGroups: async (groups: Group[]) => {
			for (const group of groups) {
				await saveGroupToStorage(group);
			}
			set({ groups, loading: false, error: null });
		},
		createGroup: async (groupData: {
			groupName: string;
			groupDescription: string;
			groupColour: string;
			friendIds: number[];
			meId: number;
		}): Promise<number | null> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: CreateGroupResponse = await createGroup(
					accessToken,
					groupData.groupName,
					groupData.groupDescription,
					groupData.groupColour,
					groupData.friendIds
				);
				if (response.success) {
					const chatId = response.data;
					const chat = { id: chatId, private: false };

					const group: Group = {
						chat_id: response.data,
						unread_messages: 0,
						mute: false,
						mute_timestamp: null,
						group_version: 0,
						avatar_version: 0,
						last_message_read_id: 0,
						user_ids: [...groupData.friendIds, groupData.meId],
						admin_ids: [groupData.meId],
						name: groupData.groupName,
						description: groupData.groupDescription,
						colour: groupData.groupColour,
						current_message_id: 1
					};

					groupStore.updateGroup(group);
					return response.data;
				}
				return null;
			} catch (err) {
				console.error('Error during group creation:', err);
				errorToast(err instanceof Error ? err.message : 'Unknown error');
				return null;
			}
		},
		removeGroup: async (groupId: number): Promise<boolean> => {
			await removeGroupFromStorage(groupId);
			await avatarStore.removeGroupAvatarFromStorage(groupId);
			update((state) => {
				const updatedGroups = state.groups.filter((g) => g.chat_id !== groupId);
				return { ...state, groups: updatedGroups };
			});
			return true;
		},
		leaveGroup: async (groupId: number): Promise<boolean> => {
			try {
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await leaveGroup(accessToken, groupId);
				if (response.success) {
					// Remove group from local storage and store
					await removeGroupFromStorage(groupId);
					await avatarStore.removeGroupAvatarFromStorage(groupId);
					update((state) => {
						const updatedGroups = state.groups.filter((g) => g.chat_id !== groupId);
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
					const group = await groupStore.getGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							user_ids: [...group.user_ids, userId]
						};
						await saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.chat_id !== groupId);
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
					const group = await groupStore.getGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							user_ids: group.user_ids.filter((id) => id !== userId),
							admin_ids: group.admin_ids.filter((id) => id !== userId)
						};
						await saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.chat_id !== groupId);
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
				const accessToken = get(accessTokenValue);
				const response: ApiResponse = await promoteAdmin(accessToken, groupId, userId, isAdmin);
				if (response.success) {
					// Update the group in local storage and store
					const group = await groupStore.getGroup(groupId);
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
						await saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.chat_id !== groupId);
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
					const group = await groupStore.getGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							name: groupName !== null ? groupName : group.name,
							description: groupDescription !== null ? groupDescription : group.description,
							colour: groupColour !== null ? groupColour : group.colour
						};
						await saveGroupToStorage(updatedGroup);
						update((state) => {
							const oldGroup = state.groups.find((g) => g.chat_id === groupId);
							if (!oldGroup) {
								return { ...state, groups: [...state.groups, updatedGroup] };
							} else {
								oldGroup.name = updatedGroup.name;
								oldGroup.description = updatedGroup.description;
								oldGroup.colour = updatedGroup.colour;
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
					const group = await groupStore.getGroup(groupId);
					if (group) {
						const updatedGroup: Group = {
							...group,
							mute: mute,
							mute_timestamp:
								mute && muteDurationHours
									? new Date(Date.now() + muteDurationHours * 60 * 60 * 1000).toISOString()
									: null
						};
						await saveGroupToStorage(updatedGroup);
						update((state) => {
							const newGroups = state.groups.filter((g) => g.chat_id !== groupId);
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
		updateGroup: async (group: Group): Promise<void> => {
			await saveGroupToStorage(group);
			update((state) => {
				const newGroups = state.groups.filter((g) => g.chat_id !== group.chat_id);
				return { ...state, groups: [...newGroups, group] };
			});
		},
		updateGroupNotSave: (group: Group): void => {
			update((state) => {
				const newGroups = state.groups.filter((g) => g.chat_id !== group.chat_id);
				return { ...state, groups: [...newGroups, group] };
			});
		},
		getGroup: async (groupId: number): Promise<Group | null> => {
			// Try IndexedDB first
			let group = (await indexedDBHelper.getGroup(groupId)) as Group | null;
			if (group) {
				return group;
			}

			return null;
		},
		getAllGroups: async (): Promise<Group[]> => {
			// Get from memory first
			const state = get({ subscribe });
			if (state.groups.length > 0) {
				return state.groups;
			}
			// Fallback to IndexedDB
			return (await indexedDBHelper.getAllGroups()) as Group[];
		},
		clear: async () => {
			set(initialState);
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearGroups();
			}
		}
	};
}

export const groupStore = createGroupStore();
