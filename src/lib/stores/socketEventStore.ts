import { writable } from 'svelte/store';

interface SocketEvent {
	type: string;
	data?: any;
}

function createSocketEventStore() {
	const { subscribe, set } = writable<SocketEvent | null>(null);

	return {
		subscribe,
		dispatch: (event: SocketEvent) => {
			set(event);
		},
		clear: () => {
			set(null);
		}
	};
}

export const socketEventStore = createSocketEventStore();
