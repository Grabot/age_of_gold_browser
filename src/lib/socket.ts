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

export function onChatAddedEvent(callback: (message: string) => void) {
	if (socket) {
		socket.on('chat_added', callback);
	}
}

export function offChatAddedEvent() {
	if (socket) {
		socket.off('chat_added');
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

export function onFriendRequestReceivedEvent(
	callback: (data: {
		friend_id: number;
		username: string;
		avatar_version: number;
		profile_version: number;
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
		accepted: boolean;
		friend_version: number;
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
