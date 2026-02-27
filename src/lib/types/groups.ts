export interface Group {
	chat_id: number;
	unread_messages: number;
	mute: boolean;
	mute_timestamp: string | null;
	group_version: number;
	avatar_version: number;
	last_message_read_id: number;
	user_ids: number[];
	admin_ids: number[];
	name: string;
	description: string;
	colour: string;
	current_message_id: number;
	avatar?: string;
}
