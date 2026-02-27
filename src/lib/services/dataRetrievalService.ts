import type { User } from '../types/user';
import type { Friend } from '../types/friend';
import type { Group } from '../types/groups';
import { getMultipleUsers } from '$lib/api/userApi';
import { userStore } from '../stores/userStore';
import { avatarStore } from '../stores/avatarStore';
import { friendStore } from '../stores/friendStore';
import { groupStore } from '../stores/groupStore';

export async function retrieveMissingUsers(userIds: number[], accessToken: string): Promise<void> {
	if (userIds.length === 0) {
		return;
	}

	try {
		const usersResponse = await getMultipleUsers(accessToken, userIds);

		if (usersResponse.data) {
			for (const userResponse of usersResponse.data) {
				const storedUser = await userStore.getUser(userResponse.id);
				const user: User = {
					id: userResponse.id,
					username: userResponse.username,
					colour: userResponse.colour,
					avatar_version: userResponse.avatar_version,
					profile_version: userResponse.profile_version,
					avatar: undefined
				};
				if (storedUser) {
					if (storedUser.avatar_version !== userResponse.avatar_version) {
						avatarStore.setShouldUpdateAvatarForUser(userResponse.id, true);
					}
				} else {
					avatarStore.setShouldUpdateAvatarForUser(userResponse.id, true);
				}
				userStore.updateUser(user);
				const storedFriend = await friendStore.getStoredFriendByFriendId(user.id);
				if (storedFriend) {
					storedFriend.user = user;
					await friendStore.updateFriend(storedFriend);
				}
			}
		}
	} catch (error) {
		console.error('Failed to retrieve missing users:', error);
	}
	return;
}

export async function retrieveMissingFriends(
	chatIds: number[],
	accessToken: string
): Promise<number[]> {
	if (chatIds.length === 0) {
		return [];
	}

	try {
		// TODO: Move imports to top level?
		const { fetchFriends } = await import('$lib/api/friendApi');
		const friendsResponse = await fetchFriends(accessToken, chatIds);

		const userIdsToRetrieve: number[] = [];

		if (friendsResponse.success && friendsResponse.data) {
			// Update each friend's data
			for (const friendData of friendsResponse.data) {
				const storedUser = await userStore.getUser(friendData.friend_id);
				if (!storedUser) {
					userIdsToRetrieve.push(friendData.friend_id);
				}
				const friend: Friend = {
					friend_id: friendData.friend_id,
					accepted: friendData.accepted,
					friend_version: friendData.friend_version,
					unread_messages: friendData.unread_messages,
					last_message_read_id: friendData.last_message_read_id,
					chat_id: friendData.chat_id,
					user: storedUser || undefined
				};

				await friendStore.updateFriend(friend);
			}
		}
		return userIdsToRetrieve;
	} catch (error) {
		console.error('Failed to retrieve missing friends data:', error);
		return [];
	}
}

export async function retrieveMissingGroups(
	groupIds: number[],
	accessToken: string
): Promise<void> {
	if (groupIds.length === 0) {
		return;
	}

	try {
		const { fetchGroups } = await import('$lib/api/groupApi');
		const groupsResponse = await fetchGroups(accessToken, groupIds);

		if (groupsResponse.success && groupsResponse.data) {
			// Update each group's data
			for (const groupData of groupsResponse.data) {
				const userGroup: Group = {
					chat_id: groupData.chat_id,
					mute: groupData.mute,
					mute_timestamp: groupData.mute_timestamp,
					group_version: groupData.group_version,
					unread_messages: groupData.unread_messages,
					avatar_version: groupData.avatar_version,
					last_message_read_id: groupData.last_message_read_id,
					user_ids: groupData.user_ids,
					admin_ids: groupData.admin_ids,
					name: groupData.name,
					description: groupData.description,
					colour: groupData.colour,
					current_message_id: groupData.current_message_id,
					avatar: undefined
				};

				const storedGroup = await groupStore.getGroup(groupData.chat_id);

				if (storedGroup) {
					if (storedGroup.avatar_version !== userGroup.avatar_version) {
						avatarStore.setShouldUpdateGroupAvatarForGroup(userGroup.chat_id, true);
						// Only update avatar_version when we actually retrieve and update the avatar.
						userGroup.avatar_version = storedGroup.avatar_version;
					}
				} else {
					avatarStore.setShouldUpdateAvatarForUser(userGroup.chat_id, true);
				}

				await groupStore.updateGroup(userGroup);
			}
		}
	} catch (error) {
		console.error('Failed to retrieve missing groups data:', error);
	}
}
