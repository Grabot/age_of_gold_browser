import { z } from 'zod';
import { accessTokenValue, authStore, refreshTokenValue } from '$lib/stores/authStore';
import { get } from 'svelte/store';

export interface FriendLogin {
	friend_id: number;
	friend_version: number;
}

export interface GroupLogin {
	group_id: number;
	group_version: number;
}

export const LoginResponseSchema = z.object({
	access_token: z.string(),
	refresh_token: z.string(),
	profile_version: z.int(),
	avatar_version: z.int(),
	friends: z.array(
		z.object({
			friend_id: z.number(),
			friend_version: z.number()
		})
	),
	groups: z.array(
		z.object({
			group_id: z.number(),
			group_version: z.number()
		})
	)
});

export interface LoginResponse {
	access_token: string;
	refresh_token: string;
	profile_version: number;
	avatar_version: number;
	friends: FriendLogin[];
	groups: GroupLogin[];
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
}

export interface ApiResult extends ApiResponse {
	message?: string;
}

class ApiConfig {
	private baseUrl: string;
	private version: string;

	constructor() {
		this.baseUrl = import.meta.env.VITE_PUBLIC_BASE_URL || '';
		this.version = import.meta.env.VITE_PUBLIC_API_VERSION || '';
	}

	readonly authEndpoints = {
		login: 'login',
		register: 'register',
		tokenLogin: 'login/token',
		tokenRefresh: 'login/token/refresh',
		logout: 'logout',
		tokenLoginGoogle: 'auth/google/token',
		forgotPassword: 'password/forgot',
		resetPassword: 'password/reset',
		deleteAccount: 'delete/account',
		deleteAccountAll: 'delete/account/all',
		deleteAccountRequest: 'delete/account/request'
	} as const;

    readonly userEndpoints = {
        changeUsername: 'user/username',
        changeColour: 'user/colour',
        changeAvatar: 'user/avatar',
        getAvatar: 'user/avatar',
        getAvatarVersion: 'user/avatar/version',
        getUser: 'user',
        getMultipleUsers: 'users'
    } as const;

	readonly friendEndpoints = {
		searchFriend: 'friend/search',
		addFriend: 'friend/add',
		fetchFriends: 'friend/all',
		respondFriendRequest: 'friend/respond',
		cancelFriendRequest: 'friend/cancel',
		removeFriend: 'friend/remove'
	} as const;

	readonly groupEndpoints = {
		createGroup: 'group/create',
		fetchGroups: 'group/all',
		leaveGroup: 'group/leave',
		addGroupMember: 'group/member/add',
		removeGroupMember: 'group/member/remove',
		promoteAdmin: 'group/admin/promote',
		updateGroup: 'group/update',
		muteGroup: 'group/mute',
		getGroupAvatar: 'group/avatar',
		getGroupAvatarVersion: 'group/avatar/version',
		changeGroupAvatar: 'group/avatar'
	} as const;

	readonly messageEndpoints = {
		sendMessage: 'message/send',
		fetchMessages: 'message/fetch',
		getMessages: 'message/chat/{chat_id}'
	} as const;

	buildUrl(endpoint: string, params?: Record<string, string | boolean>): string {
		let url = `${this.baseUrl}/${this.version}/${endpoint}`;

		if (params) {
			const searchParams = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				searchParams.append(key, String(value));
			});
			url += `?${searchParams.toString()}`;
		}

		return url;
	}
}

export const API = new ApiConfig();

type RequestBody = Record<string, unknown> | FormData | null;

interface RequestOptions {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	endpoint: string;
	accessToken?: string;
	body?: RequestBody;
	queryParams?: Record<string, string | boolean>;
	expectBlob?: boolean;
}
function buildFetchOptions(method: string, body: RequestBody | undefined, accessToken?: string) {
	const headers: Record<string, string> = {};
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`;
	}
	const isFormData = body instanceof FormData;
	if (!isFormData && body !== null && body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	const fetchOptions: RequestInit = { method, headers };
	if (body && method !== 'GET') {
		fetchOptions.body = isFormData ? body : JSON.stringify(body);
	}
	return fetchOptions;
}

async function handleResponse<T>(response: Response, expectBlob: boolean): Promise<ApiResponse<T>> {
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
	}
	if (expectBlob) {
		const blob = await response.blob();
		return { success: true, data: blob as T };
	}
	const data = await response.json();
	if (!data.success) {
		throw new Error(data.message || 'An error occurred while processing your request.');
	}
	return data as ApiResponse<T>;
}

async function refreshTokenAndRetry(
	url: string,
	fetchOptions: RequestInit,
	accessToken: string,
	refreshToken: string
): Promise<Response> {
	const newTokensResponse = await refreshTokenRequest(accessToken, refreshToken);
	await authStore.validateLoginResponse(newTokensResponse);
	fetchOptions.headers = {
		...fetchOptions.headers,
		Authorization: `Bearer ${get(accessTokenValue)}`
	};
	return await fetch(url, fetchOptions);
}

let isRefreshing = false;

export async function makeRequest<T>(options: RequestOptions): Promise<ApiResponse<T>> {
	const { method, endpoint, accessToken, body, queryParams, expectBlob = false } = options;
	const url = API.buildUrl(endpoint, queryParams);
	const fetchOptions = buildFetchOptions(method, body, accessToken);
	let response = await fetch(url, fetchOptions);

	if (
		response.status === 401 &&
		!isRefreshing &&
		endpoint !== API.authEndpoints.tokenRefresh &&
		endpoint !== API.authEndpoints.login
	) {
		isRefreshing = true;
		try {
			const refreshToken = get(refreshTokenValue);
			if (!refreshToken) {
				throw new Error('No refresh token available. Please log in again.');
			}
			response = await refreshTokenAndRetry(url, fetchOptions, accessToken!, refreshToken);
		} finally {
			isRefreshing = false;
		}
	}

	return handleResponse<T>(response, expectBlob);
}

export async function refreshTokenRequest(
	accessToken: string,
	refreshToken: string
): Promise<LoginResponse> {
	const refreshTokenLogin = await makeRequest<LoginResponse>({
		method: 'POST',
		endpoint: API.authEndpoints.tokenRefresh,
		body: {
			refresh_token: refreshToken,
			access_token: accessToken
		}
	});
	return LoginResponseSchema.parse(refreshTokenLogin.data);
}
