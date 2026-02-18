import type { User } from './user';

export interface Friend {
	friend_id: number;
	accepted: boolean | null;
	friend_version: number;
	chat_id: number;
	message_version: number;
	user?: User;
}
