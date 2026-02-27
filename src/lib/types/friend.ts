import type { User } from './user';

export interface Friend {
	friend_id: number;
	accepted: boolean | null;
	friend_version: number;
	chat_id: number;
	unread_messages: number;
	last_message_read_id: number;
	user?: User;
}
