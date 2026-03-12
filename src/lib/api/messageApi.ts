import { makeRequest, type ApiResponse, API } from './apiClient';
import type { Message } from '$lib/types/message';

export interface SendMessageRequest {
	chat_id: number;
	content: string;
	message_type?: number;
	file?: File | Blob;
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


export async function sendMessageAttachment(
	accessToken: string,
	chatId: number,
	private_chat: boolean,
	content: string,
	messageType: number,
	message_data: File | Blob | null = null
): Promise<ApiResponse> {
	const formData = new FormData();
	formData.append('chat_id', chatId.toString());
	formData.append('content', content);
	formData.append('private', private_chat.toString());
	formData.append('message_type', messageType.toString());
	if (message_data) {
		formData.append('message_data', message_data);
	}

	return makeRequest({
		method: 'POST',
		endpoint: API.messageEndpoints.sendMessageAttachments,
		accessToken,
		body: formData
	});
}

export async function sendMessage(
	accessToken: string,
	chatId: number,
	private_chat: boolean,
	content: string,
	messageType: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.messageEndpoints.sendMessage,
		accessToken,
		body: {
			chat_id: chatId,
			content: content,
			private: private_chat,
			message_type: messageType
		}
	});
}

export async function fetchMessages(
	accessToken: string,
	chatId: number,
	fromMessageId: number | null = null
): Promise<FetchMessagesResponse> {
	return makeRequest<FetchMessagesResponse['data']>({
		method: 'POST',
		endpoint: API.messageEndpoints.fetchMessages,
		accessToken,
		body: {
			chat_id: chatId,
			from_message_id: fromMessageId
		}
	}) as Promise<FetchMessagesResponse>;
}

export async function receivedMessages(
	accessToken: string,
	chatId: number,
	messageIds: number[]
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.messageEndpoints.receivedMessages,
		accessToken,
		body: {
			chat_id: chatId,
			message_ids: messageIds
		}
	});
}

export async function receivedMessage(
	accessToken: string,
	chatId: number,
	messageId: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.messageEndpoints.receivedMessage,
		accessToken,
		body: {
			chat_id: chatId,
			message_id: messageId
		}
	});
}

export async function readMessages(
	accessToken: string,
	chatId: number,
	latestMessageId: number,
	chat_type: number
): Promise<ApiResponse> {
	return makeRequest({
		method: 'POST',
		endpoint: API.messageEndpoints.readMessages,
		accessToken,
		body: {
			chat_id: chatId,
			last_message_read_id: latestMessageId,
			type: chat_type
		}
	});
}

export async function getMessageData(
	accessToken: string,
	chatId: number,
	messageId: number
): Promise<ApiResponse<Blob>> {
	return makeRequest<Blob>({
		method: 'POST',
		endpoint: API.messageEndpoints.getMessageData,
		accessToken,
		body: {
			chat_id: chatId,
			message_id: messageId
		},
		expectBlob: true
	});
}