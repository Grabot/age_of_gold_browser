import { writable } from 'svelte/store';

interface SocketEvent {
	type: string;
	data?: any;
}

function createSocketEventStore() {
	const { subscribe, set, update } = writable<SocketEvent[]>([]);

	return {
		subscribe,
		dispatch: (event: SocketEvent) => {
			update((events) => [...events, event]);
		},
		clear: () => {
			set([]);
		}
	};
}

export const socketEventStore = createSocketEventStore();
