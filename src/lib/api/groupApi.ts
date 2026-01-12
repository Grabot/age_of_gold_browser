import { z } from 'zod';
import {
    makeRequest,
    type ApiResponse,
    type LoginResponse,
    LoginResponseSchema,
    API,
    type ApiResult
} from './apiClient';
import type { Group } from '../../types/groups';

const CreateGroupResponseSchema = z.object({
    success: z.boolean(),
	data: z.number(),
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
            group_name: groupName,
            group_description: groupDescription,
            group_colour: groupColour,
            friend_ids: friendIds
        }
    });
    console.log("createGroupResponse");
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
        body: { group_ids: groupIds }
    });
}

export async function leaveGroup(
    accessToken: string,
    groupId: number
): Promise<ApiResponse> {
    return makeRequest({
        method: 'POST',
        endpoint: API.groupEndpoints.leaveGroup,
        accessToken,
        body: { group_id: groupId }
    });
}
