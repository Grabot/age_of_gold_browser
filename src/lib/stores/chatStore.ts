import { writable, get } from 'svelte/store';
import type { Chat } from '../types/groups';
import { indexedDBHelper } from './indexedDBHelper';

export const STORAGE_KEY_CHATS_PREFIX = 'chat_';

const initialState: ChatState = {
	chats: [],
	loading: false,
	error: null
};

interface ChatState {
	chats: Chat[];
	loading: boolean;
	error: string | null;
}

function createChatStore() {
	const { subscribe, update, set } = writable<ChatState>(initialState);

	if (typeof window !== 'undefined') {
		loadChatsFromStorage();
	}

	async function loadChatsFromStorage() {
		try {
			const chats = await indexedDBHelper.getAllChats() as Chat[];
			update((state) => ({ ...state, chats }));
		} catch (error) {
			console.error('Error loading chats from IndexedDB:', error);
		}
	}

	async function saveChatToStorage(chat: Chat) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.saveChat(chat);
		}
	}

	async function removeChatFromStorage(chatId: number) {
		if (typeof window !== 'undefined') {
			await indexedDBHelper.removeChat(chatId);
		}
	}

	return {
		subscribe,
		setChats: async (chats: Chat[]) => {
			for (const chat of chats) {
				await saveChatToStorage(chat);
			}
			set({ chats, loading: false, error: null });
		},
		addChat: async (chat: Chat): Promise<void> => {
			await saveChatToStorage(chat);
			update((state) => {
				const exists = state.chats.find((c) => c.id === chat.id);
				if (exists) {
					return state;
				}
				return { ...state, chats: [...state.chats, chat] };
			});
		},
		addChats: async (chats: Chat[]): Promise<void> => {
			for (const chat of chats) {
				await saveChatToStorage(chat);
			}
			update((state) => {
				const newChats = chats.filter(
					(chat) => !state.chats.find((c) => c.id === chat.id)
				);
				return { ...state, chats: [...state.chats, ...newChats] };
			});
		},
		removeChat: async (chatId: number): Promise<void> => {
			await removeChatFromStorage(chatId);
			update((state) => {
				const updatedChats = state.chats.filter((c) => c.id !== chatId);
				return { ...state, chats: updatedChats };
			});
		},
		getChat: async (chatId: number): Promise<Chat | null> => {
			const chat = await indexedDBHelper.getChat(chatId) as Chat | null;
			return chat;
		},
		getChatByGroupId: async (groupId: number): Promise<Chat | null> => {
			// Since chat id is the same as group_id, we can use getChat
			return await indexedDBHelper.getChat(groupId) as Chat | null;
		},
		updateChat: async (chat: Chat): Promise<void> => {
			await saveChatToStorage(chat);
			update((state) => {
				const newChats = state.chats.filter((c) => c.id !== chat.id);
				return { ...state, chats: [...newChats, chat] };
			});
		},
		clear: async () => {
			set(initialState);
			if (typeof window !== 'undefined') {
				await indexedDBHelper.clearChats();
			}
		}
	};
}

export const chatStore = createChatStore();
