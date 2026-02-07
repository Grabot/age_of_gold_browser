import type { Friend } from "./friend";

export interface Group {
	group_id: number;
	unread_messages: number;
	mute: boolean;
	mute_timestamp: string | null;
	group_version: number;
	message_version: number;
	avatar_version: number;
	last_message_read_id: number;
	user_ids: number[];
	admin_ids: number[];
	name: string;
	description: string;
	colour: string;
	current_message_id: number;
	avatar?: string;
	chat: Chat;
}

export interface Chat {
	id: number;
	private: boolean;
	group?: Group;
	friend?: Friend;
}