import { z } from "zod";
import { makeRequest, type ApiResponse, type LoginResponse, LoginResponseSchema, API } from './apiClient';


const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  avatar_version: z.number().optional(),
  profile_version: z.number().optional(),
});

const UserResponseSchema = z.object({
  user: UserSchema
});

const MultipleUsersResponseSchema = z.object({
  data: z.array(UserSchema)
});

export interface UserResponse {
  user?: {
    id: number,
    username: string,
    avatar_version?: number,
    profile_version?: number
  };
}

export interface MultipleUsersResponse {
  data?: Array<{
    id: number,
    username: string,
    avatar_version?: number,
    profile_version?: number
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
    body: { new_username: newUsername },
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
    body: formData,
  });
}

export async function getAvatar(
  accessToken: string,
  userId: number | null,
  getDefault: boolean | null = null,
): Promise<ApiResponse<Blob>> {
  return makeRequest<Blob>({
    method: 'POST',
    endpoint: API.userEndpoints.getAvatar,
    accessToken,
    body: { 
      user_id: userId,
      get_default: getDefault
    },
    expectBlob: true,
  });
}
export async function getUserDetail(
  accessToken: string,
): Promise<UserResponse> {
  const userResponse = await makeRequest<UserResponse>({
    method: 'GET',
    endpoint: API.userEndpoints.getUserDetail,
    accessToken,
  });
  return UserResponseSchema.parse(userResponse.data);
}

export async function getUserById(
  accessToken: string,
  userId: number
): Promise<UserResponse> {
  const userResponse = await makeRequest<UserResponse>({
    method: 'GET',
    endpoint: API.userEndpoints.getUserDetail,
    accessToken,
    queryParams: { user_id: userId.toString() },
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
    body: { user_ids: userIds },
  });
  return MultipleUsersResponseSchema.parse(userResponse);
}
