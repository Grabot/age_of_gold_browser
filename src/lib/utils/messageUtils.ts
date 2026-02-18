import type { MessageData } from "$lib/socket";
import { authStore } from "$lib/stores/authStore";
import { messageStore } from "$lib/stores/messageStore";
import type { ChatMessage } from "$lib/types/message";

// Handle incoming socket message events
export function handleIncomingMessage(messageData: MessageData) {
    console.log('Received message via socket:', messageData);
    
    const chatId = messageData.chat_id;
    const newMessageId = messageData.id;
    
    const currentUserId = authStore.getCurrentUserId();
    
    // Get the latest message ID we currently have for this chat
    const latestMessageId = messageStore.getLatestMessageId(chatId);
    
    if (latestMessageId === null) {
        // We don't have any messages for this chat yet, set shouldUpdate flag
        console.log('No messages stored for chat', chatId, '- setting shouldUpdate flag');
        messageStore.setShouldUpdateMessages(chatId, true);
    } else if (newMessageId === latestMessageId + 1) {
        // The new message is exactly one ID above our latest - we can add it directly
        console.log('Message is sequential, adding directly to chat', chatId);
        // Ensure both IDs are numbers for comparison
        const senderId = Number(messageData.sender_id);
        const currentId = Number(currentUserId);
        const chatMessage: ChatMessage = {
            ...messageData,
            is_me: senderId === currentId
        };
        messageStore.addMessage(chatMessage);
    } else {
        // There's a gap - we need to fetch all messages
        console.log('Message gap detected:', latestMessageId, '->', newMessageId, '- setting shouldUpdate flag for chat', chatId);
        messageStore.setShouldUpdateMessages(chatId, true);
    }
}
