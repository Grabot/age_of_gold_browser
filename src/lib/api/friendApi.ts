import { makeRequest, type ApiResponse, API } from './apiClient';
import type { Friend } from '$lib/types/friend';

export async function searchFriend<T>(
	accessToken: string,
	username: string
): Promise<ApiResponse<T>> {
	return makeRequest<T>({
		method: 'POST',
		endpoint: API.friendEndpoints.searchFriend,
		accessToken,
		body: { username: username }
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
		body: { user_id: userId }
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
		body: { user_ids: userIds }
	});
}

export async function respondToFriendRequest(
	accessToken: string,
	friendId: number,
	accept: boolean
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.friendEndpoints.respondFriendRequest,
		accessToken,
		body: { friend_id: friendId, accept }
	});
}

export async function cancelFriendRequest(
	accessToken: string,
	friendId: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.friendEndpoints.cancelFriendRequest,
		accessToken,
		body: { friend_id: friendId }
	});
}

export async function removeFriend(accessToken: string, friendId: number): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.friendEndpoints.removeFriend,
		accessToken,
		body: { friend_id: friendId }
	});
}
