import { z } from 'zod';
import { makeRequest, type ApiResponse, API } from './apiClient';

const UserResponseSchema = z.object({
	id: z.number(),
	username: z.string(),
	avatar_version: z.number(),
	profile_version: z.number(),
	colour: z.string()
});

const MultipleUsersResponseSchema = z.object({
	data: z.array(UserResponseSchema)
});

export interface UserResponse {
	id: number;
	username: string;
	avatar_version: number;
	profile_version: number;
	colour: string;
}

export interface MultipleUsersResponse {
	data?: Array<{
		id: number;
		username: string;
		avatar_version: number;
		profile_version: number;
		colour: string;
	}>;
}

export async function changeUsername(
	accessToken: string,
	newUsername: string
): Promise<ApiResponse<unknown>> {
	return makeRequest({
		method: 'PATCH',
		endpoint: API.userEndpoints.changeUsername,
		accessToken,
		body: { new_username: newUsername }
	});
}

export async function changeColour(
	accessToken: string,
	newColour: string
): Promise<ApiResponse<unknown>> {
	return makeRequest({
		method: 'PATCH',
		endpoint: API.userEndpoints.changeColour,
		accessToken,
		body: { new_colour: newColour }
	});
}

export async function changeAvatar(
	accessToken: string,
	newAvatar: File | null,
	useDefaultAvatar: boolean = false
): Promise<ApiResponse<unknown>> {
	const formData = new FormData();

	if (!useDefaultAvatar && newAvatar) {
		formData.append('avatar', newAvatar);
	}

	return makeRequest({
		method: 'PATCH',
		endpoint: API.userEndpoints.changeAvatar,
		accessToken,
		body: formData
	});
}

export async function getAvatar(
	accessToken: string,
	userId: number | null,
	getDefault: boolean | null = null
): Promise<ApiResponse<Blob>> {
	return makeRequest<Blob>({
		method: 'POST',
		endpoint: API.userEndpoints.getAvatar,
		accessToken,
		body: {
			user_id: userId,
			get_default: getDefault
		},
		expectBlob: true
	});
}

export async function getUser(
	accessToken: string,
	userId: number | undefined = undefined
): Promise<UserResponse> {
	const requestBody = userId !== undefined ? { userId } : undefined;

	const userResponse = await makeRequest<UserResponse>({
		method: 'POST',
		endpoint: API.userEndpoints.getUser,
		accessToken,
		body: requestBody
	});
	return UserResponseSchema.parse(userResponse.data);
}

export async function getMultipleUsers(
	accessToken: string,
	userIds: number[]
): Promise<MultipleUsersResponse> {
	const userResponse = await makeRequest<MultipleUsersResponse>({
		method: 'POST',
		endpoint: API.userEndpoints.getMultipleUsers,
		accessToken,
		body: { user_ids: userIds }
	});
	return MultipleUsersResponseSchema.parse(userResponse);
}
