import { getGroupDetails } from '$lib/api/groupApi';
import { type ApiResult } from '$lib/api/apiClient';
import type { Chat } from '../types/user';

export async function handleGetGroupDetails(
    accessToken: string,
    groupId: number
): Promise<ApiResult> {
    try {
        const response = await getGroupDetails(accessToken, groupId);
        if (!response.success) {
            throw new Error('Failed to retrieve group details.');
        }
        return { success: true, data: response.data };
    } catch (err) {
        return {
            success: false,
            message: (err as Error).message || 'An error occurred while retrieving group details.'
        };
    }
}