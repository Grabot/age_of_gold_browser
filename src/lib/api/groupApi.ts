import { z } from 'zod';
import {
	makeRequest,
	type ApiResponse,
	API,
} from './apiClient';
import type { Group } from '$lib/types/groups';

const CreateGroupResponseSchema = z.object({
	success: z.boolean(),
	data: z.number()
});

export interface CreateGroupResponse {
	success: boolean;
	data: number;
}

export async function createGroup(
	accessToken: string,
	groupName: string,
	groupDescription: string,
	groupColour: string,
	friendIds: number[]
): Promise<CreateGroupResponse> {
	const createGroupResponse = await makeRequest<CreateGroupResponse>({
		method: 'POST',
		endpoint: API.groupEndpoints.createGroup,
		accessToken,
		body: {
			name: groupName,
			description: groupDescription,
			colour: groupColour,
			friend_ids: friendIds
		}
	});
	console.log('createGroupResponse');
	console.log(createGroupResponse);
	return CreateGroupResponseSchema.parse(createGroupResponse);
}

export async function fetchGroups(
	accessToken: string,
	groupIds: number[] | null = null
): Promise<ApiResponse<Group[]>> {
	return makeRequest<Group[]>({
		method: 'POST',
		endpoint: API.groupEndpoints.fetchGroups,
		accessToken,
		body: { chat_ids: groupIds }
	});
}

export async function leaveGroup(accessToken: string, groupId: number): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.leaveGroup,
		accessToken,
		body: { chat_id: groupId }
	});
}

export async function addGroupMember(
	accessToken: string,
	groupId: number,
	userId: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.addGroupMember,
		accessToken,
		body: { chat_id: groupId, user_add_id: userId }
	});
}

export async function removeGroupMember(
	accessToken: string,
	groupId: number,
	userId: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.removeGroupMember,
		accessToken,
		body: { chat_id: groupId, user_remove_id: userId }
	});
}

export async function promoteAdmin(
	accessToken: string,
	groupId: number,
	userId: number,
	isAdmin: boolean
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.promoteAdmin,
		accessToken,
		body: { chat_id: groupId, user_id: userId, is_admin: isAdmin }
	});
}

export async function updateGroup(
	accessToken: string,
	groupId: number,
	groupName: string | null = null,
	groupDescription: string | null = null,
	groupColour: string | null = null
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.updateGroup,
		accessToken,
		body: {
			chat_id: groupId,
			name: groupName,
			description: groupDescription,
			colour: groupColour
		}
	});
}

export async function muteGroup(
	accessToken: string,
	groupId: number,
	mute: boolean,
	muteDurationHours: number | null = null
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.muteGroup,
		accessToken,
		body: {
			chat_id: groupId,
			mute: mute,
			mute_duration_hours: muteDurationHours
		}
	});
}

export async function getGroupAvatar(
	accessToken: string,
	groupId: number,
	getDefault: boolean | null = null
): Promise<ApiResponse<Blob>> {
	return makeRequest<Blob>({
		method: 'POST',
		endpoint: API.groupEndpoints.getGroupAvatar,
		accessToken,
		body: {
			chat_id: groupId,
			get_default: getDefault
		},
		expectBlob: true
	});
}

export async function getGroupAvatarVersion(
	accessToken: string,
	groupId: number
): Promise<ApiResponse<unknown>> {
	return makeRequest({
		method: 'POST',
		endpoint: API.groupEndpoints.getGroupAvatarVersion,
		accessToken,
		body: { chat_id: groupId }
	});
}

export async function changeGroupAvatar(
	accessToken: string,
	groupId: number,
	newAvatar: File | null,
	useDefaultAvatar: boolean = false
): Promise<ApiResponse<unknown>> {
	const formData = new FormData();

	if (!useDefaultAvatar && newAvatar) {
		formData.append('avatar', newAvatar);
	}

	formData.append('chat_id', groupId.toString());

	return makeRequest({
		method: 'PATCH',
		endpoint: API.groupEndpoints.changeGroupAvatar,
		accessToken,
		body: formData
	});
}
