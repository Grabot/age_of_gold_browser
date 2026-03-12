import { receivedMessage } from '$lib/api/messageApi';
import type { MessageData } from '$lib/socket';
import { accessTokenValue, authStore } from '$lib/stores/authStore';
import { friendStore } from '$lib/stores/friendStore';
import { groupStore } from '$lib/stores/groupStore';
import { messageStore } from '$lib/stores/messageStore';
import type { Message } from '$lib/types/message';
import { get } from 'svelte/store';

// Handle incoming socket message events
export async function handleIncomingMessage(messageData: MessageData) {
	console.log('Received message via socket:', messageData);

	const chatId = messageData.chat_id;
	const newMessageId = messageData.id;

	const currentUserId = await authStore.getCurrentUserId();
	if (currentUserId === messageData.sender_id) {
		// If the message is from the current user, we don't need to process it.
		// It is processed in the send message function
		console.log('Message is from current user, skipping');
		return;
	}

	// Get the latest message ID we currently have for this chat
	const latestMessageId = messageStore.getLatestMessageId(chatId);

	if (latestMessageId && newMessageId === latestMessageId + 1) {
		// The new message is exactly one ID above our latest - we can add it directly
		console.log('Message is sequential, adding directly to chat', chatId);
		// Ensure both IDs are numbers for comparison
		messageStore.addMessage(messageData);
		const accessToken = get(accessTokenValue);
		console.log("receive single message", newMessageId);
		const responseReceive = await receivedMessage(accessToken, chatId, newMessageId);
		if (responseReceive.success) {
			messageStore.setShouldUpdateMessages(chatId, false);
		}
	} else {
		// We need to fetch messages
		messageStore.setShouldUpdateMessages(chatId, true);
	}

	console.log('going to add unread message');
	const messageGroup = await groupStore.getGroup(chatId);
	if (messageGroup) {
		console.log('to group');
		messageGroup.unread_messages += 1;
		groupStore.updateGroup(messageGroup);
		return;
	}
	const messageFriend = await friendStore.getFriendByChatId(chatId);
	if (messageFriend) {
		console.log('to friend');
		messageFriend.unread_messages += 1;
		friendStore.updateFriend(messageFriend);
		return;
	}
	return;
}
