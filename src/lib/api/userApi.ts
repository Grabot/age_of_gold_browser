import { z } from "zod";
import { makeRequest, type ApiResponse, type LoginResponse, LoginResponseSchema, API } from './apiClient';


const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
});

const UserResponseSchema = z.object({
  user: UserSchema
});

export interface UserResponse {
  user?: {
    id: number,
    username: string
  };
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
