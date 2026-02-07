import type { Chat } from './groups';
import type { User } from './user';

export interface Friend {
	friend_id: number;
	accepted: boolean | null;
	friend_version: number;
	chat_id: number | null;
	user?: User;
	chat?: Chat;
}
