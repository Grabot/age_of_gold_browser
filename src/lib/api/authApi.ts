import { makeRequest, type ApiResponse, type LoginResponse, LoginResponseSchema, API } from './apiClient';


export async function loginUser(
  email: string | null,
  username: string | null,
  password: string
): Promise<LoginResponse> {
  const responseLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.authEndpoints.login,
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
    endpoint: API.authEndpoints.register,
    body: { email, username, password },
  });
  return LoginResponseSchema.parse(registerLogin.data);
}

export async function validateToken(
  accessToken: string,
): Promise<LoginResponse> {
  const tokenLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.authEndpoints.tokenLogin,
    accessToken: accessToken,
  });
  return LoginResponseSchema.parse(tokenLogin.data);
}

export async function logoutUser(
  accessToken: string,
): Promise<ApiResponse<unknown>> {
  return makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.authEndpoints.logout,
    accessToken: accessToken,
  });
}

export async function loginTokenGoogle(
  accessTokenGoogle: string,
): Promise<LoginResponse> {
  const refreshTokenLogin = await makeRequest<LoginResponse>({
    method: 'POST',
    endpoint: API.authEndpoints.tokenLoginGoogle,
    body: {
      access_token: accessTokenGoogle
    },
  });
  return LoginResponseSchema.parse(refreshTokenLogin.data);
}

export async function forgotPassword(
  email: string,
): Promise<boolean> {
  const forgotPasswordLogin = await makeRequest<boolean>({
    method: 'POST',
    endpoint: API.authEndpoints.forgotPassword,
    body: {
      "email": email
    },
  });
  return forgotPasswordLogin["success"];
}

export async function resetPassword(
  newPassword: string,
  accessToken: string,
): Promise<boolean> {
  const resetPasswordLogin = await makeRequest<boolean>({
    method: 'PATCH',
    endpoint: API.authEndpoints.resetPassword,
    accessToken: accessToken,
    body: {
      "new_password": newPassword
    },
  });
  return resetPasswordLogin["success"];
}

export async function deleteAccount(
  accessToken: string,
): Promise<ApiResponse<unknown>> {
  return await makeRequest<boolean>({
    method: 'DELETE',
    endpoint: API.authEndpoints.deleteAccount,
    accessToken: accessToken,
  });
}

export async function deleteAccountRequest(
  email: string,
): Promise<ApiResponse<unknown>> {
  return await makeRequest<boolean>({
    method: 'POST',
    endpoint: API.authEndpoints.deleteAccountRequest,
    body: {
      "email": email
    },
  });
}

export async function confirmDeleteAccount(
  accessToken: string,
): Promise<ApiResponse<unknown>> {
  return await makeRequest<boolean>({
    method: 'DELETE',
    endpoint: API.authEndpoints.deleteAccountAll,
    accessToken: accessToken,
  });
}