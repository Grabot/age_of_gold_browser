export interface Message {
	id: number;
	chat_id: number;
	sender_id: number;
	content: string;
	created_at: string;
	message_type: number;
}
