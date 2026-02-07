import { writable, get } from 'svelte/store';
import type { Message, ChatMessage } from '$lib/types/message';
import { indexedDBHelper } from './indexedDBHelper';

export const STORAGE_KEY_MESSAGES_PREFIX = 'messages_';

interface MessagesState {
	messages: Map<number, ChatMessage[]>; // chat_id -> messages
	loading: boolean;
	error: string | null;
}

const initialState: MessagesState = {
	messages: new Map(),
	loading: false,
	error: null
};

function createMessageStore() {
	const { subscribe, update, set } = writable<MessagesState>(initialState);

	if (typeof window !== 'undefined') {
		loadMessagesFromStorage();
	}

	async function loadMessagesFromStorage() {
		try {
			const allMessages = await indexedDBHelper.getAllMessages() as ChatMessage[];
			const messagesMap = new Map<number, ChatMessage[]>();
			
			allMessages.forEach((msg) => {
				const chatId = msg.chat_id;
				if (!messagesMap.has(chatId)) {
					messagesMap.set(chatId, []);
				}
				messagesMap.get(chatId)!.push(msg);
			});
			
			// Sort messages by created_at
			messagesMap.forEach((msgs) => {
				msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
			});
			
			update((state) => ({ ...state, messages: messagesMap }));
		} catch (error) {
			console.error('Error loading messages from IndexedDB:', error);
		}
	}

	async function saveMessageToStorage(message: ChatMessage) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveMessage(message);
		}
	}

	async function saveMessagesToStorage(chatId: number, messages: ChatMessage[]) {
		if (typeof window !== 'undefined') {
			for (const message of messages) {
				await indexedDBHelper.saveMessage(message);
			}
		}
	}

	return {
		subscribe,
		
		// Add a message to a chat
		addMessage: async (message: ChatMessage) => {
			await saveMessageToStorage(message);
			
			update((state) => {
				const newMessages = new Map(state.messages);
				const chatId = message.chat_id;
				
				if (!newMessages.has(chatId)) {
					newMessages.set(chatId, []);
				}
				
				const chatMessages = newMessages.get(chatId)!;
				// Check if message already exists
				const exists = chatMessages.some(m => m.id === message.id);
				if (!exists) {
					chatMessages.push(message);
					// Sort by created_at
					chatMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				}
				
				return { ...state, messages: newMessages };
			});
		},
		
		// Add multiple messages to a chat
		addMessages: async (chatId: number, messages: ChatMessage[]) => {
			await saveMessagesToStorage(chatId, messages);
			
			update((state) => {
				const newMessages = new Map(state.messages);
				
				if (!newMessages.has(chatId)) {
					newMessages.set(chatId, []);
				}
				
				const chatMessages = newMessages.get(chatId)!;
				
				messages.forEach((message) => {
					const exists = chatMessages.some(m => m.id === message.id);
					if (!exists) {
						chatMessages.push(message);
					}
				});
				
				// Sort by created_at
				chatMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
				
				return { ...state, messages: newMessages };
			});
		},
		
		// Get messages for a specific chat
		getMessagesForChat: (chatId: number): ChatMessage[] => {
			const state = get({ subscribe });
			return state.messages.get(chatId) || [];
		},
		
		// Set messages for a chat (replaces existing messages)
		setMessagesForChat: async (chatId: number, messages: ChatMessage[]) => {
			// Clear existing messages for this chat from storage
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearMessagesForChat(chatId);
				for (const message of messages) {
					await indexedDBHelper.saveMessage(message);
				}
			}
			
			update((state) => {
				const newMessages = new Map(state.messages);
				// Sort by created_at
				const sortedMessages = [...messages].sort((a, b) => 
					new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
				);
				newMessages.set(chatId, sortedMessages);
				return { ...state, messages: newMessages };
			});
		},
		
		// Clear messages for a specific chat
		clearMessagesForChat: async (chatId: number) => {
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearMessagesForChat(chatId);
			}
			
			update((state) => {
				const newMessages = new Map(state.messages);
				newMessages.delete(chatId);
				return { ...state, messages: newMessages };
			});
		},
		
		// Clear all messages
		clear: async () => {
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearAllMessages();
			}
			set(initialState);
		},
		
		setLoading: (loading: boolean) => {
			update((state) => ({ ...state, loading }));
		},
		
		setError: (error: string | null) => {
			update((state) => ({ ...state, error }));
		}
	};
}

export const messageStore = createMessageStore();
