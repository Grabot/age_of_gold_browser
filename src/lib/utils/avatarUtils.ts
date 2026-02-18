import { get } from 'svelte/store';
import { accessTokenValue } from '../stores/authStore';
import { avatarStore } from '../stores/avatarStore';
import { userStore } from '../stores/userStore';
import { friendStore } from '../stores/friendStore';
import {
	handleGetAvatar,
	handleGetGroupAvatar,
	handleGetGroupAvatarVersion
} from '../services/settingsService';
import { errorToast } from './toast';
import type { User } from '../types/user';
import type { Group } from '../types/groups';
import type { Friend } from '../types/friend';
import { groupStore } from '../stores/groupStore';

export async function updateUserAvatar(user: User): Promise<User | null> {
	const accessToken = get(accessTokenValue);
	if (accessToken && user) {
		const avatarResponse = await handleGetAvatar(accessToken, user.id, false);
		if (avatarResponse.success && avatarResponse.avatar) {
			user.avatar = avatarResponse.avatar;
			await avatarStore.updateAvatar(user.id, avatarResponse.avatar);
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
	const accessToken = get(accessTokenValue);
	if (accessToken && group) {
		const avatarResponse = await handleGetGroupAvatar(accessToken, group.chat_id, false);
		if (avatarResponse.success && avatarResponse.avatar) {
			group.avatar = avatarResponse.avatar;
			await avatarStore.updateGroupAvatar(group.chat_id, avatarResponse.avatar);
			const avatarVersionResponse = await handleGetGroupAvatarVersion(accessToken, group.chat_id);
			if (avatarVersionResponse.success && avatarVersionResponse.avatarVersion) {
				group.avatar_version = avatarVersionResponse.avatarVersion;
			}
			groupStore.updateGroup(group);
			await avatarStore.setShouldUpdateGroupAvatarForGroup(group.chat_id, false);
			return group;
		} else {
			errorToast('Failed to fetch avatar');
		}
	}
	return group;
}

export async function checkUserAvatar(friend: Friend): Promise<void> {
	if (friend.user) {
		if (!friend.user.avatar) {
			const avatarUser = await avatarStore.getAvatar(friend.friend_id);
			if (avatarUser) {
				friend.user.avatar = avatarUser;
				friendStore.updateFriend(friend);
				userStore.updateUser(friend.user);
			} else {
				const updatedUser = await updateUserAvatar(friend.user);
				if (updatedUser) {
					friend.user = updatedUser;
					friendStore.updateFriend(friend);
				}
			}
		}
	}
}

export async function checkGroupAvatar(group: Group): Promise<void> {
	if (!group.avatar) {
		const avatarGroup = await avatarStore.getGroupAvatar(group.chat_id);
		if (avatarGroup) {
			group.avatar = avatarGroup;
			groupStore.updateGroupNotSave(group);
		} else {
			await updateGroupAvatar(group);
		}
	}
}
