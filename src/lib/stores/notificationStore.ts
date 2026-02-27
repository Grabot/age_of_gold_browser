import { get, writable } from 'svelte/store';
import { friendStore } from './friendStore';
import { groupStore } from './groupStore';
import { avatarStore } from './avatarStore';
import { userStore } from './userStore';
import { checkGroupAvatar, checkUserAvatar } from '$lib/utils/avatarUtils';

export interface ChatNotification {
	chatId: number;
	chatType: 'friend' | 'group';
	name: string;
	colour?: string;
	avatar?: string;
	unreadCount?: number;
}

interface NotificationState {
	notifications: ChatNotification[];
	hasUnreadMessages: boolean;
}

const initialState: NotificationState = {
	notifications: [],
	hasUnreadMessages: false
};

function createNotificationStore() {
	const { subscribe, set, update } = writable<NotificationState>(initialState);

	async function loadNotifications(): Promise<void> {
		try {
			// Get all friends and groups
			const allFriends = await friendStore.getAllFriends();
			const allGroups = await groupStore.getAllGroups();

			// Filter only chats that have unread_messages > 0
			const friendsWithUnread = allFriends.filter(
				(friend) => friend.accepted && friend.user && friend.unread_messages > 0
			);
			const groupsWithUnread = allGroups.filter((group) => group.unread_messages > 0);

			if (friendsWithUnread.length === 0 && groupsWithUnread.length === 0) {
				set({ notifications: [], hasUnreadMessages: false });
				return;
			}

			// Build notification objects with chat details
			const notifications: ChatNotification[] = [];

			// Add friend notifications
			for (const friend of friendsWithUnread) {
                let notificationUsername;
                let notificationColour;
                let notificationAvatar;
				if (friend.user) {
					notificationUsername = friend.user.username;
                    notificationColour = friend.user.colour;
                    if (friend.user.avatar) {
                        notificationAvatar = friend.user.avatar;
                    } else {
                        const storedAvatar = await avatarStore.getAvatar(friend.friend_id);
                        if (storedAvatar) {
                            notificationAvatar = storedAvatar;
                        } else {
                            notificationAvatar = "";
                        }
                    }
				} else {
                    const storedUser = await userStore.getUser(friend.friend_id);
                    if (storedUser) {
                        friend.user = storedUser;
                        notificationUsername = friend.user.username;
                        notificationColour = friend.user.colour;
                        if (friend.user.avatar) {
                            notificationAvatar = friend.user.avatar;
                        } else {
                            await checkUserAvatar(friend);
                            const storedAvatar = await avatarStore.getAvatar(friend.friend_id);
                            if (storedAvatar) {
                                notificationAvatar = storedAvatar;
                            } else {
                                notificationAvatar = "";
                            }
                        }
                    } else {
                        // TODO: What to do in this situation?
                        notificationUsername = "user";
                        notificationColour = "";
                        notificationAvatar = "";
                    }
                }

                notifications.push({
					chatId: friend.chat_id,
					chatType: 'friend',
					name: notificationUsername,
					colour: notificationColour,
					avatar: notificationAvatar,
					unreadCount: friend.unread_messages
				});
			}

			// Add group notifications
			for (const group of groupsWithUnread) {
				// Try to get group avatar from avatar store
				let groupAvatar: string | null = null;
				try {
					groupAvatar = await avatarStore.getGroupAvatar(group.chat_id);
				} catch (error) {
					console.error('Error getting group avatar:', error);
				}

				notifications.push({
					chatId: group.chat_id,
					chatType: 'group',
					name: group.name,
					colour: group.colour,
					avatar: groupAvatar || undefined,
					unreadCount: group.unread_messages
				});
			}

			set({
				notifications,
				hasUnreadMessages: notifications.length > 0
			});
		} catch (error) {
			console.error('Error loading notifications:', error);
			set({ notifications: [], hasUnreadMessages: false });
		}
	}
    
	async function checkData(): Promise<void> {
		// An extra function that is called when the notification dropdown is shown.
		// If the avatar is not filled yet it will be loaded here.
		const currentState = get({ subscribe });

		const updatedNotifications = await Promise.all(
			currentState.notifications.map(async (notification) => {
				if (notification.chatType === "friend" && !notification.avatar) {
					const friend = await friendStore.getFriendByChatId(notification.chatId);
					if (friend) {
						await checkUserAvatar(friend);
						const storedAvatar = await avatarStore.getAvatar(friend.friend_id);
						return {
							...notification,
							avatar: storedAvatar || ""
						};
					}
				} else if (notification.chatType === "group" && !notification.avatar) {
					const group = await groupStore.getGroup(notification.chatId);
					if (group) {
						await checkGroupAvatar(group);
						const storedAvatar = await avatarStore.getGroupAvatar(group.chat_id);
						return {
							...notification,
							avatar: storedAvatar || ""
						};
					}
				}
				return notification;
			})
		);

		set({
			notifications: updatedNotifications,
			hasUnreadMessages: updatedNotifications.length > 0
		});
	}


	async function clearNotification(chatId: number): Promise<void> {
		try {
			// Find the friend or group and update its unread_messages to 0
			const friend = await friendStore.getFriendByChatId(chatId);
			if (friend) {
				friend.unread_messages = 0;
				await friendStore.updateFriend(friend);
			} else {
				const group = await groupStore.getGroup(chatId);
				if (group) {
					group.unread_messages = 0;
					await groupStore.updateGroup(group);
				}
			}
			await loadNotifications();
		} catch (error) {
			console.error('Error clearing notification:', error);
		}
	}

	async function clearAllNotifications(): Promise<void> {
		// TODO: Is this how I want to solve this? Do I send a update to the server?
		try {
			// Update all friends and groups to have 0 unread_messages
			const allFriends = await friendStore.getAllFriends();
			for (const friend of allFriends) {
				if (friend.unread_messages > 0) {
					friend.unread_messages = 0;
					await friendStore.updateFriend(friend);
				}
			}

			const allGroups = await groupStore.getAllGroups();
			for (const group of allGroups) {
				if (group.unread_messages > 0) {
					group.unread_messages = 0;
					await groupStore.updateGroup(group);
				}
			}

			set({ notifications: [], hasUnreadMessages: false });
		} catch (error) {
			console.error('Error clearing all notifications:', error);
		}
	}

	function addNotification(notification: ChatNotification): void {
		update((state) => {
			// Check if the notification already exists (e.g., same chatId)
			const existingIndex = state.notifications.findIndex((n) => n.chatId === notification.chatId);

			let updatedNotifications;
			if (existingIndex >= 0) {
				// Update existing notification (e.g., increment unreadCount)
				updatedNotifications = [...state.notifications];
				updatedNotifications[existingIndex] = {
					...updatedNotifications[existingIndex],
					unreadCount:
						(updatedNotifications[existingIndex].unreadCount || 0) + (notification.unreadCount || 1)
				};
			} else {
				// Add new notification
				updatedNotifications = [...state.notifications, notification];
			}

			return {
				notifications: updatedNotifications,
				hasUnreadMessages: updatedNotifications.length > 0
			};
		});
	}

	return {
		subscribe,
		loadNotifications,
        checkData,
		clearNotification,
		clearAllNotifications,
		addNotification
	};
}

export const notificationStore = createNotificationStore();
