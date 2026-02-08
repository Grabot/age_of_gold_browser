import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function connectSocket(userId: number): Socket {
	if (socket && socket.connected) {
		return socket;
	}

	socket = io(import.meta.env.VITE_PUBLIC_BASE_URL || '', {
		path: '/socket.io',
		withCredentials: true,
		transports: ['websocket']
	});

	socket.on('connect', () => {
		console.log('Connected to socket server');
	});

	socket.on('disconnect', () => {
		console.log('Disconnected from socket server');
	});

	return socket;
}

export function disconnectSocket() {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
}

export function joinRoom(userId: number) {
	if (socket) {
		socket.emit('join', { user_id: userId });
	}
}

export function leaveRoom(userId: number) {
	if (socket) {
		socket.emit('leave', { user_id: userId });
	}
}

export function joinGroup(groupId: number) {
	if (socket) {
		socket.emit('join_group', { chat_id: groupId });
	}
}

export function leaveGroup(groupId: number) {
	if (socket) {
		socket.emit('leave_group', { chat_id: groupId });
	}
}

export function onMessageEvent(callback: (message: string) => void) {
	if (socket) {
		socket.on('message_event', callback);
	}
}

export function offMessageEvent() {
	if (socket) {
		socket.off('message_event');
	}
}

export function onUsernameUpdatedEvent(
	callback: (data: { user_id: number; new_username: string; profile_version: number }) => void
) {
	if (socket) {
		socket.on('username_updated', callback);
	}
}

export function offUsernameUpdatedEvent() {
	if (socket) {
		socket.off('username_updated');
	}
}

export function onColourUpdatedEvent(
	callback: (data: { user_id: number; new_colour: string; profile_version: number }) => void
) {
	if (socket) {
		socket.on('colour_updated', callback);
	}
}

export function offColourUpdatedEvent() {
	if (socket) {
		socket.off('colour_updated');
	}
}

export function onFriendRequestReceivedEvent(
	callback: (data: {
		friend_id: number;
		username: string;
		avatar_version: number;
		profile_version: number;
		colour: string;
	}) => void
) {
	if (socket) {
		socket.on('friend_request_received', callback);
	}
}

export function offFriendRequestReceivedEvent() {
	if (socket) {
		socket.off('friend_request_received');
	}
}

export function onAvatarUpdatedEvent(callback: (data: { user_id: number }) => void) {
	if (socket) {
		socket.on('avatar_updated', callback);
	}
}

export function offAvatarUpdatedEvent() {
	if (socket) {
		socket.off('avatar_updated');
	}
}

export function onFriendRequestAcceptedEvent(
	callback: (data: {
		friend_id: number;
		username: string;
		avatar_version: number;
		profile_version: number;
		colour: string;
		accepted: boolean;
		friend_version: number;
		chat_id: number;
	}) => void
) {
	if (socket) {
		socket.on('friend_request_accepted', callback);
	}
}

export function offFriendRequestAcceptedEvent() {
	if (socket) {
		socket.off('friend_request_accepted');
	}
}

export function onFriendRequestRejectedEvent(callback: (data: { friend_id: number }) => void) {
	if (socket) {
		socket.on('friend_request_rejected', callback);
	}
}

export function offFriendRequestRejectedEvent() {
	if (socket) {
		socket.off('friend_request_rejected');
	}
}

export function onFriendRequestCanceledEvent(callback: (data: { friend_id: number }) => void) {
	if (socket) {
		socket.on('friend_request_canceled', callback);
	}
}

export function offFriendRequestCanceledEvent() {
	if (socket) {
		socket.off('friend_request_canceled');
	}
}

export function onFriendRemovedEvent(callback: (data: { friend_id: number }) => void) {
	if (socket) {
		socket.on('friend_removed', callback);
	}
}

export function offFriendRemovedEvent() {
	if (socket) {
		socket.off('friend_removed');
	}
}

export function onGroupCreatedEvent(
	callback: (data: {
		chat_id: number;
		name: string;
		description: string;
		colour: string;
		creator_id: number;
		creator_username: string;
	}) => void
) {
	if (socket) {
		socket.on('group_created', callback);
	}
}

export function offGroupCreatedEvent() {
	if (socket) {
		socket.off('group_created');
	}
}

export function onGroupMemberLeftEvent(
	callback: (data: { chat_id: number; user_id: number }) => void
) {
	if (socket) {
		socket.on('group_member_left', callback);
	}
}

export interface GroupAdminChangedEventData {
	chat_id: number;
	user_id: number;
	is_admin: boolean;
}
export function onGroupAdminChangedEvent(callback: (data: GroupAdminChangedEventData) => void) {
	if (socket) {
		socket.on('group_admin_changed', callback);
	}
}

export function offGroupMemberLeftEvent() {
	if (socket) {
		socket.off('group_member_left');
	}
}

export interface GroupUpdateEventData {
	chat_id: number;
	name: string | undefined;
	description: string | undefined;
	colour: string | undefined;
}
export function onGroupUpdateEvent(callback: (data: GroupUpdateEventData) => void) {
	if (socket) {
		socket.on('group_updated', callback);
	}
}

export function offGroupUpdateEvent() {
	if (socket) {
		socket.off('group_updated');
	}
}

export interface GroupMemberRemovedEventData {
	chat_id: number;
	user_id: number;
}
export function onGroupMemberRemovedEvent(callback: (data: GroupMemberRemovedEventData) => void) {
	if (socket) {
		socket.on('group_member_removed', callback);
	}
}

export function offGroupMemberRemovedEvent() {
	if (socket) {
		socket.off('group_member_removed');
	}
}

export interface GroupMemberAddedEventData {
	chat_id: number;
	user_id: number;
}
export function onGroupMemberAddedEvent(callback: (data: GroupMemberAddedEventData) => void) {
	if (socket) {
		socket.on('group_member_added', callback);
	}
}

export function offGroupMemberAddedEvent() {
	if (socket) {
		socket.off('group_member_added');
	}
}

export interface GroupAvatarChangedEventData {
	chat_id: number;
	user_id: number;
}
export function onGroupAvatarChangedEvent(callback: (data: GroupAvatarChangedEventData) => void) {
	console.log('on group avatar updated');
	if (socket) {
		socket.on('group_avatar_updated', callback);
	}
}

export function offGroupAvatarChangedEvent() {
	if (socket) {
		socket.off('group_avatar_updated');
	}
}

export interface MessageData {
	id: number;
	chat_id: number;
	sender_id: number;
	content: string;
	created_at: string;
	message_type: number;
}

export function onMessageReceivedEvent(callback: (data: MessageData) => void) {
	if (socket) {
		socket.on('message_received', callback);
	}
}

export function offMessageReceivedEvent() {
	if (socket) {
		socket.off('message_received');
	}
}

