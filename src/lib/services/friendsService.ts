import { searchFriend } from '$lib/api/friendApi';
import { type ApiResult } from '$lib/api/apiClient';

interface FriendSearchResult {
	id: number;
	username: string;
}

export async function handleSearchFriend(
	accessToken: string,
	username: string
): Promise<ApiResult> {
	try {
		const response: ApiResult = await searchFriend<FriendSearchResult>(accessToken, username);
		if (!response.success) {
			throw new Error(response.message || 'Failed to retrieve user.');
		}
		return { success: true, data: response.data };
	} catch (err) {
		return {
			success: false,
			message: (err as Error).message || 'An error occurred during friend retrieval.'
		};
	}
}
