import { changeAvatar, changeUsername, getAvatar, type ApiResponse, type ApiResult } from "$lib/authLib/apiClient";
import { get } from "svelte/store";
import { userAvatar, userDetail } from "../stores/authStore";
import type { User } from "../types/user";

export async function handleChangeUsername(accessToken: string, newUsername: string): Promise<ApiResult> {
  try {
    const response: ApiResult = await changeUsername(accessToken, newUsername);
    if (!response.success) {
      throw new Error(response.message || 'Failed to change username.');
    }
    const current_user: User = get(userDetail);
    userDetail.set({ ...current_user, username: newUsername });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'An error occurred during username change.',
    };
  }
}

export async function handleChangeAvatar(accessToken: string, newAvatar: File, defaultAvatar: boolean): Promise<ApiResult> {
  try {
    const response: ApiResult = await changeAvatar(accessToken, newAvatar, defaultAvatar);
    if (!response.success) {
      throw new Error(response.message || 'Failed to change avatar.');
    }

    const avatarBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(newAvatar);
    });

    if (!avatarBase64) {
      throw new Error('Issue converting avatar.');
    }
    userAvatar.set(avatarBase64);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: (err as Error).message || 'An error occurred during avatar change.',
    };
  }
}

export async function handleGetAvatar(accessToken: string, get_default: boolean = false): Promise<{ success: boolean; message?: string; avatar?: string }> {
  try {
    const response = await getAvatar(accessToken, get_default);

    if (response.success) {
      const avatarBase64 = await new Promise<string>((resolve) => {
        if (!response.data) {
          return null;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(response.data);
      });

      if (!avatarBase64) {
        throw new Error('Issue converting avatar.');
      }
      return { success: true, avatar: avatarBase64 };
    } else {
      return { success: false, message: 'Get avatar failed.' };
    }
  } catch (err) {
    return { success: false, message: (err as Error).message || 'Getting avatar failed' };
  }
}
