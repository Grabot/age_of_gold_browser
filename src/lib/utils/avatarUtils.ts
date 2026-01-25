import { get } from 'svelte/store';
import { accessTokenValue } from '../stores/authStore';
import { avatarStore } from '../stores/avatarStore';
import { userStore } from '../stores/userStore';
import {
	handleGetAvatar,
	handleGetAvatarVersion,
	handleGetGroupAvatar,
	handleGetGroupAvatarVersion
} from '../services/settingsService';
import { errorToast } from './toast';
import type { User } from '../types/user';
import type { Group } from '../types/groups';
import { groupStore } from '../stores/groupStore';

export async function updateUserAvatar(user: User): Promise<User | null> {
	const accessToken = get(accessTokenValue);
	if (accessToken && user) {
		const avatarResponse = await handleGetAvatar(accessToken, user.id, false);
		if (avatarResponse.success && avatarResponse.avatar) {
			user.avatar = avatarResponse.avatar;
			await avatarStore.updateAvatar(user.id, avatarResponse.avatar);
			const avatarVersionResponse = await handleGetAvatarVersion(accessToken, user.id);
			if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
				user.avatar_version = avatarVersionResponse.avatarVersion;
			}
			userStore.updateUser(user);
			await avatarStore.setShouldUpdateAvatarForUser(user.id, false);
			return user;
		} else {
			errorToast('Failed to fetch avatar');
		}
	}
	return null;
}

export async function updateGroupAvatar(group: Group): Promise<Group | null> {
	console.log('update group avatar');
	const accessToken = get(accessTokenValue);
	if (accessToken && group) {
		const avatarResponse = await handleGetGroupAvatar(accessToken, group.group_id, false);
		if (avatarResponse.success && avatarResponse.avatar) {
			group.avatar = avatarResponse.avatar;
			await avatarStore.updateGroupAvatar(group.group_id, avatarResponse.avatar);
			const avatarVersionResponse = await handleGetGroupAvatarVersion(accessToken, group.group_id);
			if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
				console.log('updating avatar version', avatarVersionResponse.avatarVersion);
				group.avatar_version = avatarVersionResponse.avatarVersion;
			}
			groupStore.updateGroup(group);
			await avatarStore.setShouldUpdateGroupAvatarForGroup(group.group_id, false);
			return group;
		} else {
			errorToast('Failed to fetch avatar');
		}
	}
	return group;
}
