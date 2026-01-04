import { z } from "zod";
import { makeRequest, type ApiResponse, type LoginResponse, LoginResponseSchema, API, type ApiResult } from './apiClient';
import type { Friend } from '../../types/user';

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

export async function fetchFriends(
  accessToken: string,
  userIds: number[] | null = null
): Promise<ApiResponse<Friend[]>> {
  return makeRequest<Friend[]>({
    method: 'POST',
    endpoint: API.friendEndpoints.fetchFriends,
    accessToken,
    body: { user_ids: userIds },
  });
}
