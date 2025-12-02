import { z } from "zod";
import { accessTokenValue, authStore, refreshTokenValue } from "../../stores/authStore";
import { get } from "svelte/store";

const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
});

const LoginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  profile_version: z.int(),
  avatar_version: z.int(),
});

const UserResponseSchema = z.object({
  user: UserSchema
});

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  profile_version: number;
  avatar_version: number;
}

export interface UserResponse {
  user?: {
    id: number,
    username: string
  };
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

  readonly endpoints = {
    changeUsername: 'user/username',
    changeAvatar: 'user/avatar',
    getAvatar: 'user/avatar',
    getUserDetail: 'user/detail',
    login: 'login',
    register: 'register',
    tokenLogin: 'login/token',
    tokenRefresh: 'login/token/refresh',
    logout: 'logout',
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

const API = new ApiConfig();


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
    throw new Error(data.message || "An error occurred while processing your request.");
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
    'Authorization': `Bearer ${get(accessTokenValue)}`,
  };
  return await fetch(url, fetchOptions);
}

let isRefreshing = false;

async function makeRequest<T>(options: RequestOptions): Promise<ApiResponse<T>> {
  const { method, endpoint, accessToken, body, queryParams, expectBlob = false } = options;
  const url = API.buildUrl(endpoint, queryParams);
  let fetchOptions = buildFetchOptions(method, body, accessToken);
  let response = await fetch(url, fetchOptions);

  if (response.status === 401 && !isRefreshing && endpoint !== API.endpoints.tokenRefresh && endpoint !== API.endpoints.login) {
    isRefreshing = true;
    try {
      const refreshToken = get(refreshTokenValue);
      if (!refreshToken) {
        throw new Error("No refresh token available. Please log in again.");
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
  refreshToken: string,
): Promise<LoginResponse> {
  const refreshTokenLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.endpoints.tokenRefresh,
    body: {
      refresh_token: refreshToken,
      access_token: accessToken
    },
  });
  return LoginResponseSchema.parse(refreshTokenLogin.data);
}

export async function changeUsername(
  accessToken: string,
  newUsername: string
): Promise<ApiResponse<unknown>> {
  return makeRequest({
    method: 'PATCH',
    endpoint: API.endpoints.changeUsername,
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
    endpoint: API.endpoints.changeAvatar,
    accessToken,
    body: formData,
  });
}

export async function getAvatar(
  accessToken: string,
  getDefault: boolean = false
): Promise<ApiResponse<Blob>> {
  return makeRequest<Blob>({
    method: 'GET',
    endpoint: API.endpoints.getAvatar,
    accessToken,
    queryParams: getDefault ? { get_default: getDefault } : undefined,
    expectBlob: true,
  });
}

export async function loginUser(
  email: string | null,
  username: string | null,
  password: string
): Promise<LoginResponse> {
  const responseLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.endpoints.login,
    body: { email, username, password },
  });
  return LoginResponseSchema.parse(responseLogin.data);
}

export async function registerUser(
  email: string,
  username: string,
  password: string
): Promise<LoginResponse> {
  const registerLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.endpoints.register,
    body: { email, username, password },
  });
  return LoginResponseSchema.parse(registerLogin.data);
}

export async function validateToken(
  accessToken: string,
): Promise<LoginResponse> {
  const tokenLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.endpoints.tokenLogin,
    accessToken: accessToken,
  });
  return LoginResponseSchema.parse(tokenLogin.data);
}

export async function getUserDetail(
  accessToken: string,
): Promise<UserResponse> {
  const userResponse = await makeRequest<UserResponse>({
    method: 'GET',
    endpoint: API.endpoints.getUserDetail,
    accessToken,
  });
  return UserResponseSchema.parse(userResponse.data);
}
export async function logoutUser(
  accessToken: string,
): Promise<ApiResponse<unknown>> {
  return makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.endpoints.logout,
    accessToken: accessToken,
  });
}
