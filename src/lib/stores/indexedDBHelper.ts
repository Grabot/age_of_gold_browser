import { writable } from 'svelte/store';

export const DB_NAME = 'AgeOfGoldDB';
export const DB_VERSION = 14; // Incremented for adding MESSAGE_BLOB_STORE
export const USER_STORE = 'users';
export const FRIEND_STORE = 'friends';
export const GROUP_STORE = 'groups';
export const MESSAGE_STORE = 'messages';
export const USER_AVATAR_STORE = 'userAvatars';
export const GROUP_AVATAR_STORE = 'groupAvatars';
export const SHOULD_UPDATE_USER_AVATAR_STORE = 'shouldUpdateUserAvatars';
export const SHOULD_UPDATE_GROUP_AVATAR_STORE = 'shouldUpdateGroupAvatars';
export const SHOULD_UPDATE_MESSAGES_STORE = 'shouldUpdateMessages';
export const MESSAGE_MEDIA_STORE = 'messageMedia';
export const MESSAGE_BLOB_STORE = 'messageBlobs';

export interface IndexedDBHelperState {
	isInitialized: boolean;
	isLoading: boolean;
	error: Error | null;
}

interface StoreSchema {
	name: string;
	keyPath: string | string[];
	indexes?: { name: string; keyPath: string; unique?: boolean }[];
}

interface UserAvatarUpdate {
	userId: number;
	shouldUpdate: boolean;
}

interface GroupAvatarUpdate {
	groupId: number;
	shouldUpdate: boolean;
}

interface MessageUpdate {
	chatId: number;
	shouldUpdate: boolean;
}

interface MessageMedia {
	chatId: number;
	messageId: number;
	mediaPath: string;
}

interface MessageBlob {
	chatId: number;
	messageId: number;
	blob: Blob;
	timestamp: number; // For cache invalidation
}

const STORES: StoreSchema[] = [
	{ name: USER_STORE, keyPath: 'id' },
	{ name: FRIEND_STORE, keyPath: 'chat_id' },
	{ name: GROUP_STORE, keyPath: 'chat_id' },
	{ name: MESSAGE_STORE, keyPath: ['chat_id', 'id'] },
	{ name: USER_AVATAR_STORE, keyPath: 'userId' },
	{ name: GROUP_AVATAR_STORE, keyPath: 'groupId' },
	{ name: SHOULD_UPDATE_USER_AVATAR_STORE, keyPath: 'userId' },
	{ name: SHOULD_UPDATE_GROUP_AVATAR_STORE, keyPath: 'groupId' },
	{ name: SHOULD_UPDATE_MESSAGES_STORE, keyPath: 'chatId' },
	{ name: MESSAGE_MEDIA_STORE, keyPath: ['chatId', 'messageId'] },
	{ name: MESSAGE_BLOB_STORE, keyPath: ['chatId', 'messageId'] }
];

const initialState: IndexedDBHelperState = {
	isInitialized: false,
	isLoading: false,
	error: null
};

function createIndexedDBHelper() {
	const { subscribe, update } = writable<IndexedDBHelperState>(initialState);

	let db: IDBDatabase | null = null;

	async function initDB(): Promise<void> {
		if (typeof window === 'undefined') {
			return;
		}

		update((state) => ({ ...state, isLoading: true, error: null }));

		try {
			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = (event) => {
				update((state) => ({
					...state,
					isLoading: false,
					error: new Error('Failed to open IndexedDB')
				}));
				console.error('IndexedDB error:', event);
			};

			request.onsuccess = (event) => {
				db = (event.target as IDBOpenDBRequest).result;
				update((state) => ({ ...state, isInitialized: true, isLoading: false }));
			};

			request.onupgradeneeded = (event) => {
				db = (event.target as IDBOpenDBRequest).result;

				STORES.forEach((storeSchema) => {
					if (!db!.objectStoreNames.contains(storeSchema.name)) {
						const store = db!.createObjectStore(storeSchema.name, {
							keyPath: storeSchema.keyPath
						});

						storeSchema.indexes?.forEach((index) => {
							store.createIndex(index.name, index.keyPath, {
								unique: index.unique || false
							});
						});
					}
				});
			};
		} catch (error) {
			update((state) => ({
				...state,
				isLoading: false,
				error: error instanceof Error ? error : new Error('Unknown error')
			}));
			console.error('IndexedDB initialization error:', error);
		}
	}

	async function ensureDB(): Promise<IDBDatabase> {
		if (db) {
			return db;
		}

		await initDB();

		return new Promise((resolve, reject) => {
			let unsubscribe: (() => void) | null = null;

			const checkState = (state: IndexedDBHelperState) => {
				if (state.isInitialized && db) {
					if (unsubscribe) unsubscribe();
					resolve(db!);
				} else if (state.error) {
					if (unsubscribe) unsubscribe();
					reject(state.error);
				}
			};

			unsubscribe = subscribe(checkState);
		});
	}

	async function save<T>(storeName: string, data: T): Promise<void> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);
			console.log('Saving data to store:', storeName);
			const request = store.put(data);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error(`Failed to save to ${storeName}`));
			});
		} catch (error) {
			console.error(`Error saving to ${storeName}:`, error);
			throw error;
		}
	}

	async function get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);

			const request = store.get(key);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || null);
				request.onerror = () => reject(new Error(`Failed to get from ${storeName}`));
			});
		} catch (error) {
			console.error(`Error getting from ${storeName}:`, error);
			return null;
		}
	}

	async function getAll<T>(storeName: string): Promise<T[]> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);

			const request = store.getAll();

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || []);
				request.onerror = () => reject(new Error(`Failed to get all from ${storeName}`));
			});
		} catch (error) {
			console.error(`Error getting all from ${storeName}:`, error);
			return [];
		}
	}

	async function remove(storeName: string, key: IDBValidKey): Promise<void> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);

			const request = store.delete(key);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error(`Failed to remove from ${storeName}`));
			});
		} catch (error) {
			console.error(`Error removing from ${storeName}:`, error);
			throw error;
		}
	}

	async function clear(storeName: string): Promise<void> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readwrite');
			const store = transaction.objectStore(storeName);

			const request = store.clear();

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve();
				request.onerror = () => reject(new Error(`Failed to clear ${storeName}`));
			});
		} catch (error) {
			console.error(`Error clearing ${storeName}:`, error);
			throw error;
		}
	}

	async function clearAll(): Promise<void> {
		try {
			const database = await ensureDB();
			const storeNames = STORES.map((store) => store.name);
			const transaction = database.transaction(storeNames, 'readwrite');

			storeNames.forEach((storeName) => {
				transaction.objectStore(storeName).clear();
			});

			return new Promise((resolve, reject) => {
				transaction.oncomplete = () => resolve();
				transaction.onerror = () => reject(new Error('Failed to clear all stores'));
			});
		} catch (error) {
			console.error('Error clearing all stores:', error);
			throw error;
		}
	}

	async function getByIndex<T>(
		storeName: string,
		indexName: string,
		key: IDBValidKey
	): Promise<T[]> {
		try {
			const database = await ensureDB();
			const transaction = database.transaction(storeName, 'readonly');
			const store = transaction.objectStore(storeName);
			const index = store.index(indexName);

			const request = index.getAll(key);

			return new Promise((resolve, reject) => {
				request.onsuccess = () => resolve(request.result || []);
				request.onerror = () => reject(new Error(`Failed to get from ${storeName} by index`));
			});
		} catch (error) {
			console.error(`Error getting from ${storeName} by index:`, error);
			return [];
		}
	}

	return {
		subscribe,
		initDB,
		save,
		get,
		getAll,
		remove,
		clear,
		clearAll,
		saveUser: (user: any) => save(USER_STORE, user),
		getUser: async (id: number) => await get(USER_STORE, id),
		getAllUsers: async () => await getAll(USER_STORE),
		removeUser: (id: number) => remove(USER_STORE, id),
		clearUsers: () => clear(USER_STORE),

		saveFriend: (friend: any) => save(FRIEND_STORE, friend),
		getFriend: async (id: number) => await get(FRIEND_STORE, id),
		getAllFriends: async () => await getAll(FRIEND_STORE),
		removeFriend: (id: number) => remove(FRIEND_STORE, id),
		clearFriends: () => clear(FRIEND_STORE),

		saveGroup: (group: any) => save(GROUP_STORE, group),
		getGroup: async (id: number) => await get(GROUP_STORE, id),
		getAllGroups: async () => await getAll(GROUP_STORE),
		removeGroup: (id: number) => remove(GROUP_STORE, id),
		clearGroups: () => clear(GROUP_STORE),

		saveUserAvatar: (userId: number, avatar: string) => save(USER_AVATAR_STORE, { userId, avatar }),
		getUserAvatar: async (userId: number) => await get(USER_AVATAR_STORE, userId),
		removeUserAvatar: (userId: number) => remove(USER_AVATAR_STORE, userId),
		clearUserAvatars: () => clear(USER_AVATAR_STORE),

		saveGroupAvatar: (groupId: number, avatar: string) =>
			save(GROUP_AVATAR_STORE, { groupId, avatar }),
		getGroupAvatar: async (groupId: number) => await get(GROUP_AVATAR_STORE, groupId),
		removeGroupAvatar: (groupId: number) => remove(GROUP_AVATAR_STORE, groupId),
		clearGroupAvatars: () => clear(GROUP_AVATAR_STORE),

		saveShouldUpdateUserAvatar: (userId: number, shouldUpdate: boolean) =>
			save<UserAvatarUpdate>(SHOULD_UPDATE_USER_AVATAR_STORE, { userId, shouldUpdate }),

		getShouldUpdateUserAvatar: async (userId: number) => {
			const result = await get<UserAvatarUpdate>(SHOULD_UPDATE_USER_AVATAR_STORE, userId);
			return result ? result.shouldUpdate : false;
		},

		removeShouldUpdateUserAvatar: (userId: number) =>
			remove(SHOULD_UPDATE_USER_AVATAR_STORE, userId),
		clearShouldUpdateUserAvatars: () => clear(SHOULD_UPDATE_USER_AVATAR_STORE),

		saveShouldUpdateGroupAvatar: (groupId: number, shouldUpdate: boolean) =>
			save<GroupAvatarUpdate>(SHOULD_UPDATE_GROUP_AVATAR_STORE, { groupId, shouldUpdate }),

		getShouldUpdateGroupAvatar: async (groupId: number) => {
			const result = await get<GroupAvatarUpdate>(SHOULD_UPDATE_GROUP_AVATAR_STORE, groupId);
			return result ? result.shouldUpdate : false;
		},

		removeShouldUpdateGroupAvatar: (groupId: number) =>
			remove(SHOULD_UPDATE_GROUP_AVATAR_STORE, groupId),
		clearShouldUpdateGroupAvatars: () => clear(SHOULD_UPDATE_GROUP_AVATAR_STORE),

		saveMessage: (message: any) => save(MESSAGE_STORE, message),
		getMessage: async (chatId: number, id: number) => await get(MESSAGE_STORE, [chatId, id]),
		getAllMessages: async () => await getAll(MESSAGE_STORE),
		getMessagesByChatId: async (chatId: number) => {
			// Get all messages and filter by chat_id since we can't use index with composite key
			const allMessages = await getAll(MESSAGE_STORE);
			return allMessages.filter((msg: any) => msg.chat_id === chatId);
		},
		removeMessage: (chatId: number, id: number) => remove(MESSAGE_STORE, [chatId, id]),
		clearMessagesForChat: async (chatId: number) => {
			// Get all messages and filter by chat_id since we can't use index with composite key
			const allMessages = await getAll<any>(MESSAGE_STORE);
			const chatMessages = allMessages.filter((msg: any) => msg.chat_id === chatId);
			for (const message of chatMessages) {
				await remove(MESSAGE_STORE, [chatId, message.id]);
			}
		},
		clearAllMessages: () => clear(MESSAGE_STORE),

		saveShouldUpdateMessages: (chatId: number, shouldUpdate: boolean) =>
			save<MessageUpdate>(SHOULD_UPDATE_MESSAGES_STORE, { chatId, shouldUpdate }),

		getShouldUpdateMessages: async (chatId: number) => {
			const result = await get<MessageUpdate>(SHOULD_UPDATE_MESSAGES_STORE, chatId);
			return result ? result.shouldUpdate : false;
		},

		removeShouldUpdateMessages: (chatId: number) => remove(SHOULD_UPDATE_MESSAGES_STORE, chatId),
		clearShouldUpdateMessages: () => clear(SHOULD_UPDATE_MESSAGES_STORE),

		// Message Media functions
		saveMessageMedia: (chatId: number, messageId: number, mediaPath: string) => 
			save(MESSAGE_MEDIA_STORE, { chatId, messageId, mediaPath }),
		getMessageMedia: async (chatId: number, messageId: number) => {
			const result = await get<MessageMedia>(MESSAGE_MEDIA_STORE, [chatId, messageId]);
			return result ? result.mediaPath : null;
		},
		removeMessageMedia: (chatId: number, messageId: number) => remove(MESSAGE_MEDIA_STORE, [chatId, messageId]),
		clearMessageMedia: () => clear(MESSAGE_MEDIA_STORE),

		// Message Blob functions (for persistent media caching)
		saveMessageBlob: async (chatId: number, messageId: number, blob: Blob) => {
			try {
				const database = await ensureDB();
				const transaction = database.transaction(MESSAGE_BLOB_STORE, 'readwrite');
				const store = transaction.objectStore(MESSAGE_BLOB_STORE);

				const messageBlob: MessageBlob = {
					chatId,
					messageId,
					blob,
					timestamp: Date.now()
				};

				const request = store.put(messageBlob);

				return new Promise<void>((resolve, reject) => {
					request.onsuccess = () => resolve();
					request.onerror = () => reject(new Error(`Failed to save blob to ${MESSAGE_BLOB_STORE}`));
				});
		} catch (error) {
			console.error(`Error saving blob to ${MESSAGE_BLOB_STORE}:`, error);
			throw error;
		}
		},

		getMessageBlob: async (chatId: number, messageId: number): Promise<Blob | null> => {
			try {
				const database = await ensureDB();
				const transaction = database.transaction(MESSAGE_BLOB_STORE, 'readonly');
				const store = transaction.objectStore(MESSAGE_BLOB_STORE);

				const request = store.get([chatId, messageId]);

				return new Promise((resolve, reject) => {
					request.onsuccess = () => {
						const result = request.result;
						resolve(result ? result.blob : null);
					};
					request.onerror = () => reject(new Error(`Failed to get blob from ${MESSAGE_BLOB_STORE}`));
				});
		} catch (error) {
			console.error(`Error getting blob from ${MESSAGE_BLOB_STORE}:`, error);
			return null;
		}
		},

		removeMessageBlob: (chatId: number, messageId: number) => remove(MESSAGE_BLOB_STORE, [chatId, messageId]),
		clearMessageBlobs: () => clear(MESSAGE_BLOB_STORE),

		// Helper function to clean up old blobs (optional cache management)
		cleanupOldBlobs: async (maxAgeDays: number = 30) => {
			try {
				const database = await ensureDB();
				const transaction = database.transaction(MESSAGE_BLOB_STORE, 'readwrite');
				const store = transaction.objectStore(MESSAGE_BLOB_STORE);

				const allBlobs = await getAll<MessageBlob>(MESSAGE_BLOB_STORE);
				const now = Date.now();
				const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

				for (const blobEntry of allBlobs) {
					if (now - blobEntry.timestamp > maxAgeMs) {
						await remove(MESSAGE_BLOB_STORE, [blobEntry.chatId, blobEntry.messageId]);
					}
				}
			} catch (error) {
				console.error('Error cleaning up old blobs:', error);
			}
		}
	};
}

export const indexedDBHelper = createIndexedDBHelper();
