import { makeRequest, type ApiResponse, API } from './apiClient';
import type { Message } from '$lib/types/message';

export interface SendMessageRequest {
	chat_id: number;
	content: string;
	message_type?: number;
}

export interface SendMessageResponse {
	success: boolean;
	data: Message;
}

export interface FetchMessagesRequest {
	chat_id: number;
	from_message_id?: number | null;
}

export interface FetchMessagesResponse {
	success: boolean;
	data: {
		chat_id: number;
		messages: Message[];
	};
}

export async function sendMessage(
	accessToken: string,
	chatId: number,
	content: string,
	messageType: number = 0
): Promise<SendMessageResponse> {
	return makeRequest<SendMessageResponse['data']>({
		method: 'POST',
		endpoint: API.messageEndpoints.sendMessage,
		accessToken,
		body: {
			chat_id: chatId,
			content: content,
			message_type: messageType
		}
	}) as Promise<SendMessageResponse>;
}

export async function fetchMessages(
	accessToken: string,
	chatId: number,
	fromMessageId: number | null = null,
): Promise<FetchMessagesResponse> {
	return makeRequest<FetchMessagesResponse['data']>({
		method: 'POST',
		endpoint: API.messageEndpoints.fetchMessages,
		accessToken,
		body: {
			chat_id: chatId,
			from_message_id: fromMessageId,
		}
	}) as Promise<FetchMessagesResponse>;
}
