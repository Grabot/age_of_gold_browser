<script lang="ts">
	import { SvelteToast, toast } from '@zerodevx/svelte-toast';
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount, onDestroy } from 'svelte';
	import { authStore } from '../stores/authStore';
	import {
		connectSocket,
		disconnectSocket,
		joinRoom,
		leaveRoom,
		onMessageEvent,
		offMessageEvent
	} from '$lib/socket';
	import type { Socket } from 'socket.io-client';
	import { page } from '$app/state';

	let { children } = $props();
	const options = {};

	let socket: Socket | null = null;
	let userId: number | null = null;

	function handleMessageEvent(message: string) {
		console.log('socket message:', message);
	}

	onMount(() => {
		const isAuthPage = page.url.pathname.startsWith('/auth/');
		if (!isAuthPage) {
			if (authStore.isValidationNeeded()) {
				authStore.validateToken();
			} else {
				authStore.authorized();
			}
		}

		const unsubscribe = authStore.subscribe((state) => {
			if (state.isAuthenticated && state.user) {
				userId = state.user.id;
				if (userId) {
					socket = connectSocket(userId);
					joinRoom(userId);
					onMessageEvent(handleMessageEvent);
				}
			} else {
				if (socket) {
					if (userId != null) {
						leaveRoom(userId);
						disconnectSocket();
					}
					socket = null;
				}
			}
		});

		onDestroy(() => {
			unsubscribe();
			if (socket) {
				if (userId != null) {
					leaveRoom(userId);
					disconnectSocket();
				}
			}
			offMessageEvent();
		});
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<SvelteToast {options} />
