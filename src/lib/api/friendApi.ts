import { z } from "zod";
import { makeRequest, type ApiResponse, type LoginResponse, LoginResponseSchema, API, type ApiResult } from './apiClient';

export async function searchFriend<T>(
  accessToken: string,
  username: string
): Promise<ApiResponse<T>> {
  return makeRequest<T>({
    method: 'POST',
    endpoint: API.friendEndpoints.searchFriend,
    accessToken,
    body: { username: username },
  });
}

export async function sendFriendRequest<T>(
  accessToken: string,
  userId: number
): Promise<ApiResponse<T>> {
  return makeRequest<T>({
    method: 'POST',
    endpoint: API.friendEndpoints.addFriend,
    accessToken,
    body: { user_id: userId },
  });
}
