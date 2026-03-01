<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import { friendStore } from '$lib/stores/friendStore';
	import { userStore } from '$lib/stores/userStore';
	import { messageStore } from '$lib/stores/messageStore';
	import { accessTokenValue, authStore } from '$lib/stores/authStore';
	import { getInitial } from '$lib/utils/groupUtils';
	import { getTextColourForBackground } from '$lib/utils/colourUtils';
	import type { Contact } from '$lib/types/contact';
	import MessageItem from './MessageItem.svelte';
	import MediaPreview from './MediaPreview.svelte';
	import DocumentUpload from './DocumentUpload.svelte';
	import AudioRecorder from './AudioRecorder.svelte';
	import CameraView from './CameraView.svelte';
	import {
		isGroup,
		isFriend,
		getContactName,
		getContactAvatar,
		getContactColour,
		getContactUnreadCount,
		getContactPrivate,
		getContactChatId,
		getContactMessages
	} from '$lib/types/contact';
	import type { Message } from '$lib/types/message';
	import { onMount } from 'svelte';
	import { pushState } from '$app/navigation';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { indexedDBHelper } from '$lib/stores/indexedDBHelper';
	import {
		updateGroupAvatar,
		updateUserAvatar,
		checkUserAvatar,
		checkGroupAvatar
	} from '$lib/utils/avatarUtils';
	import { errorToast } from '$lib/utils/toast';
	import {
		fetchMessages,
		readMessages,
		receivedMessages,
		sendMessage,
		type FetchMessagesResponse
	} from '$lib/api/messageApi';
	import { socketEventStore } from '$lib/stores/socketEventStore';
	import type { MessageData } from '$lib/socket';
	import { get } from 'svelte/store';
	import type { User } from '$lib/types/user';
	import { retrieveMissingUsers } from '$lib/services/dataRetrievalService';
	import type { Group } from '$lib/types/groups';
	import type { ApiResponse } from '$lib/api/apiClient';
	import type { Friend } from '$lib/types/friend';
	import Page from '../../routes/+page.svelte';
	import { notificationStore } from '$lib/stores/notificationStore';

	export let onClose: () => void;
	export let initialSelectedChatId: number | null = null;

	let selectedContact: Contact | null = null;
	let newMessage = '';
	let currentUserId: number | null = null;
	let messagesEndRef: HTMLDivElement | null = null;
	let innerWidth = window.innerWidth;
	let innerHeight = window.innerHeight;
	let showSidebarOnMobile = true;
	let showAttachmentMenu = false;
	let showAttachmentPreview = false;
	let showDocumentUpload = false;
	let showAudioRecorder = false;
	let showCameraView = false;
	let selectedAttachmentType: 'image' | 'video' | 'document' | 'audio' | 'camera' | null = null;

	// Cache for sender info to avoid repeated lookups
	// Group members for the currently selected group
	let groupMembers: Array<{ user_id: number; username: string; avatar: string | null }> = [];

	// Reactive mobile detection (portrait orientation or narrow viewport)
	$: isMobile = innerWidth < 768 || innerHeight > innerWidth;
	$: showSidebar = !isMobile || showSidebarOnMobile;
	$: showMessages = !isMobile || !showSidebarOnMobile;

	// Reactive variables for selected contact properties - these update automatically when selectedContact changes
	$: selectedChatId = selectedContact ? getContactChatId(selectedContact) : initialSelectedChatId;
	$: selectedColor = selectedContact ? getContactColour(selectedContact) || '' : null;
	$: selectedTextColor = selectedColor ? getTextColourForBackground(selectedColor) : null;
	$: selectedChatName = selectedContact ? getContactName(selectedContact) : 'Chat';
	$: selectedChatAvatar = selectedContact ? getContactAvatar(selectedContact) : undefined;
	$: selectedChatInitial = selectedContact ? getInitial(getContactName(selectedContact)) : '';
	$: selectedChatPrivate = selectedContact ? getContactPrivate(selectedContact) : true;
	$: currentMessages = selectedContact
		? getContactMessages(selectedContact, $messageStore.messages)
		: [];

	// Build sender username map whenever groupMembers or selectedContact changes
	let getUserDetailsDone = false;
	let senderUsernameMap: Map<number, string> = new Map();
	let senderAvatarMap: Map<number, string | null> = new Map();

	function checkUsernameMapReady(
		contact: Contact | null,
		members: Array<{ user_id: number; username: string; avatar: string | null }>,
		map: Map<number, string>
	): boolean {
		// For friend chats, map is ready immediately if we have the friend data
		if (contact && isFriend(contact)) {
			return contact.user !== undefined;
		}

		// For group chats, check if we have members loaded
		if (contact && isGroup(contact)) {
			// If no members yet, not ready
			if (members.length === 0) {
				return false;
			}

			// Check if the map has entries (meaning members were processed)
			return map.size > 0;
		}

		return true; // Default to ready for other cases
	}

	function buildSenderAvatarMap(
		members: Array<{ user_id: number; username: string; avatar: string | null }>
	): Map<number, string | null> {
		const map = new Map<number, string | null>();

		// For group chats, use the groupMembers array
		members.forEach((member) => {
			map.set(member.user_id, member.avatar);
		});

		return map;
	}

	function buildSenderUsernameMap(
		members: Array<{ user_id: number; username: string; avatar: string | null }>
	): Map<number, string> {
		const map = new Map<number, string>();

		members.forEach((member) => {
			map.set(member.user_id, member.username);
		});

		return map;
	}

	// Load avatar for contact if not available
	async function loadContactAvatar(contact: Contact) {
		const accessToken = get(accessTokenValue);
		if (!accessToken) return;

		if (isGroup(contact)) {
			if (contact.avatar) return;
			const shouldUpdate = await avatarStore.getShouldUpdateGroupAvatarForGroup(contact.chat_id);
			if (shouldUpdate) {
				const updatedGroup = await updateGroupAvatar(contact);
				if (updatedGroup) {
					await groupStore.updateGroup(updatedGroup);
				}
			}
		} else if (isFriend(contact) && contact.user) {
			if (contact.user.avatar) return;

			const shouldUpdate = await avatarStore.getShouldUpdateAvatarForUser(contact.friend_id);
			if (shouldUpdate) {
				const updatedUser = await updateUserAvatar(contact.user);
				if (updatedUser) {
					contact.user = updatedUser;
					await friendStore.updateFriend(contact);
				}
			}
		}
	}

	async function selectContact(contact: Contact) {
		console.log('selectContact called with:', contact);
		getUserDetailsDone = false;
		// Clear group members when switching chats
		groupMembers = [];

		// Clear unread messages when user opens this chat
		const chatId = getContactChatId(contact);

		// Load avatar if not available
		await loadContactAvatar(contact);

		// Force update by creating new object reference
		selectedContact = { ...contact };

		// On mobile, switch to messages view
		if (isMobile) {
			showSidebarOnMobile = false;
		}

		if (isGroup(selectedContact)) {
			loadGroupMembers(selectedContact as Group);
		} else {
			getUserDetailsDone = true;
		}

		// Pass the contact directly to avoid reactivity timing issues
		await loadMessagesForContact(contact);
	}

	function goBackToSidebar() {
		showSidebarOnMobile = true;
		selectedContact = null;
	}

	function handleResize() {
		innerWidth = window.innerWidth;
		innerHeight = window.innerHeight;
	}

	function handlePopState(event: PopStateEvent) {
		// If chat is open and user presses back, close the chat
		onClose();
	}

	function setupBackButtonCapture() {
		// Push a new history state when chat opens using SvelteKit's pushState
		pushState('', { chatOpen: true });
	}

	async function loadMessagesForContact(contact: Contact) {
		const chatId = getContactChatId(contact);
		console.log('loading messages for contact', chatId, contact);
		await loadMessagesForChatId(chatId);
	}

	async function loadMessagesForChatId(chatId: number | null) {
		console.log('loading messages for chatId', chatId);
		const accessToken = get(accessTokenValue);

		if (!chatId || !currentUserId || !accessToken || !selectedContact) return;

		messageStore.setLoading(true);

		// First, load stored messages from IndexedDB
		const storedMessages = (await indexedDBHelper.getMessagesByChatId(chatId)) as Message[];
		if (storedMessages && storedMessages.length > 0) {
			messageStore.addMessages(chatId, storedMessages);
			console.log('Loaded stored messages:', storedMessages.length);
		}

		// Check if we need to update messages from backend using chatId
		const shouldUpdate = await messageStore.getShouldUpdateMessages(chatId);
		console.log('shouldUpdate:', shouldUpdate);

		// Get the latest message ID to fetch only new messages
		let latestMessageId = messageStore.getLatestMessageId(chatId);
		if (shouldUpdate) {
			console.log('Fetching messages from backend...');

			console.log('Latest message ID:', latestMessageId);

			const responseFetch: FetchMessagesResponse = await fetchMessages(
				accessToken,
				chatId,
				latestMessageId
			);

			if (!responseFetch.success) {
				errorToast('Failed to fetch messages');
				messageStore.setLoading(false);
				return;
			}

			console.log('Messages fetched from backend:', responseFetch.data);
			messageStore.addMessages(chatId, responseFetch.data.messages);
			const messageIds = responseFetch.data.messages.map((message) => message.id);
			console.log('ids of fetched messages', messageIds);
			// Clear the shouldUpdate flag using chatId
			await messageStore.setShouldUpdateMessages(chatId, false);

			if (messageIds.length !== 0) {
				latestMessageId = Math.max(...messageIds);
				console.log('going to send receive indicators');
				await receivedMessages(accessToken, chatId, messageIds);
			}
		}

		// TODO: send read message indicator (not tested)
		if (latestMessageId) {
			await messageRead(accessToken, chatId, latestMessageId);
		}
		await notificationStore.clearNotification(chatId);
		messageStore.setLoading(false);
		setTimeout(scrollToBottom, 100);
	}

	async function messageRead(accessToken: string, chatId: number, latestMessageId: number) {
		console.log('reading message');
		let chatType = 0;
		if (selectedChatPrivate) {
			chatType = 1;
		}
		const responseRead = await readMessages(accessToken, chatId, latestMessageId, chatType);
		if (responseRead.success && selectedContact) {
			if (isGroup(selectedContact)) {
				(selectedContact as Group).unread_messages = 0;
				(selectedContact as Group).last_message_read_id = latestMessageId;
				groupStore.updateGroup(selectedContact as Group);
			} else {
				(selectedContact as Friend).unread_messages = 0;
				(selectedContact as Friend).last_message_read_id = latestMessageId;
				friendStore.updateFriend(selectedContact as Friend);
			}
		}
		return;
	}

	async function handleSendMessage() {
		const accessToken = get(accessTokenValue);
		const chatId = selectedChatId || initialSelectedChatId;

		if (newMessage.trim() && chatId && currentUserId && accessToken) {
			const response = await sendMessage(
				accessToken,
				chatId,
				selectedChatPrivate,
				newMessage.trim()
			);
			if (!response.success) {
				errorToast('Failed to send message');
				return;
			}
			const messageData: MessageData = {
				id: response.data as number,
				chat_id: chatId,
				sender_id: currentUserId as number,
				content: newMessage.trim(),
				created_at: new Date().toISOString(),
				message_type: 0
			};
			console.log('Sending message');
			console.log(messageData);
			messageStore.addMessage(messageData);
			newMessage = '';
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSendMessage();
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function scrollToBottom() {
		if (messagesEndRef) {
			messagesEndRef.scrollIntoView({ behavior: 'smooth' });
		}
	}

	function toggleAttachmentMenu() {
		showAttachmentMenu = !showAttachmentMenu;
	}

	function handleAttachmentSelect(type: string) {
		console.log('Selected attachment type:', type);
		showAttachmentMenu = false;

		if (type === 'photos-videos') {
			selectedAttachmentType = 'image';
			showAttachmentPreview = true;
		} else if (type === 'document') {
			selectedAttachmentType = 'document';
			showDocumentUpload = true;
		} else if (type === 'audio') {
			selectedAttachmentType = 'audio';
			showAudioRecorder = true;
		} else if (type === 'camera') {
			selectedAttachmentType = 'camera';
			showCameraView = true;
		} else {
			// TODO: Implement file handling for other attachment types
			console.log('Attachment type not yet implemented:', type);
		}
	}

	function handleAttachmentSave(data: {
		file?: File | null;
		caption?: string | null;
		mediaType: 'image' | 'video';
	}) {
		console.log('Media saved:', data);
		showAttachmentPreview = false;
		// TODO: Implement sending the media via API
	}

	function handleDocumentSave(data: { file?: File | null; filename: string }) {
		console.log('Document saved:', data);
		showDocumentUpload = false;
		// TODO: Implement sending the document via API
	}

	function handleAudioSave(data: {
		audioBlob?: Blob | null;
		audioUrl?: string | null;
		duration: number;
	}) {
		console.log('Audio saved:', data);
		showAudioRecorder = false;
		// TODO: Implement sending the audio via API
	}

	function handleCameraSave(data: { imageBlob?: Blob | null; imageUrl?: string | null }) {
		console.log('Image saved:', data);
		showCameraView = false;
		// TODO: Implement sending the image via API
	}

	function handleAttachmentClose() {
		showAttachmentPreview = false;
		selectedAttachmentType = null;
	}

	function handleDocumentClose() {
		showDocumentUpload = false;
		selectedAttachmentType = null;
	}

	function handleAudioClose() {
		showAudioRecorder = false;
		selectedAttachmentType = null;
	}

	function handleCameraClose() {
		showCameraView = false;
		selectedAttachmentType = null;
	}

	function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			console.log('File selected:', file.name, file.type);
			// TODO: Implement file upload logic
		}
	}

	// Handle incoming socket message events
	async function handleIncomingMessageChatOpen(messageData: MessageData) {
		console.log('Received message via socket while chat is open:', messageData);
		const currentUserId = await authStore.getCurrentUserId();
		if (messageData.sender_id === currentUserId) {
			console.log('I send the message, ignore');
			return;
		}
		// Check if the message belongs to the currently selected chat
		const chatId = messageData.chat_id;
		console.log('selectedchat', selectedChatId || initialSelectedChatId);
		console.log('chatId', chatId);
		if ((selectedChatId || initialSelectedChatId) === chatId) {
			setTimeout(scrollToBottom, 100);
			const newMessageId = messageData.id;
			const accessToken = get(accessTokenValue);
			await messageRead(accessToken, chatId, newMessageId);
		}
	}

	// Load group members for group chats
	async function loadGroupMembers(group: Group) {
		if (!group || !group.user_ids) return;

		let newMembers: Array<{ user_id: number; username: string; avatar: string | null }> = [];

		let userIdsToRetrieve = [];
		let avatarIdsToRetrieve = [];
		for (const userId of group.user_ids) {
			// Skip current user - we'll handle them separately
			if (currentUserId === userId) continue;

			const groupUser = await userStore.getUser(userId);
			const avatarUser = await avatarStore.getAvatar(userId);

			for (const userId of group.user_ids) {
				if (currentUserId === userId) continue;

				const groupUser = await userStore.getUser(userId);
				const avatarUser = await avatarStore.getAvatar(userId);

				if (groupUser && avatarUser) {
					if (!newMembers.some((member) => member.user_id === groupUser.id)) {
						newMembers.push({
							user_id: groupUser.id,
							username: groupUser.username,
							avatar: avatarUser
						});
					}
				} else if (groupUser && !avatarUser) {
					avatarIdsToRetrieve.push(userId);
					if (!newMembers.some((member) => member.user_id === groupUser.id)) {
						newMembers.push({
							user_id: groupUser.id,
							username: groupUser.username,
							avatar: null
						});
					}
				} else if (!groupUser && avatarUser) {
					userIdsToRetrieve.push(userId);
					if (!newMembers.some((member) => member.user_id === userId)) {
						newMembers.push({
							user_id: userId,
							username: 'User',
							avatar: avatarUser
						});
					}
				} else {
					userIdsToRetrieve.push(userId);
					avatarIdsToRetrieve.push(userId);
					if (!newMembers.some((member) => member.user_id === userId)) {
						newMembers.push({
							user_id: userId,
							username: 'User',
							avatar: null
						});
					}
				}
			}
		}

		groupMembers = newMembers;
		const accessToken = get(accessTokenValue);
		if (userIdsToRetrieve.length > 0 && accessToken) {
			await retrieveMissingUsers(userIdsToRetrieve, accessToken);
			for (const userId of avatarIdsToRetrieve) {
				const user = await userStore.getUser(userId);
				if (user) {
					const updatedUser = await updateUserAvatar(user);
					if (updatedUser) {
						groupMembers = groupMembers.map((member) =>
							member.user_id === updatedUser.id
								? {
										...member,
										username: updatedUser.username,
										avatar: updatedUser.avatar ?? null
									}
								: member
						);
					}
				}
			}
		}
		senderAvatarMap = buildSenderAvatarMap(groupMembers);
		senderUsernameMap = buildSenderUsernameMap(groupMembers);
		getUserDetailsDone = true;
		console.log('Loaded group members:', groupMembers.length);
	}

	// Get username for a message sender from the reactive map
	async function getMessageUsername(senderId: number): Promise<string> {
		if (senderId === currentUserId) {
			return '';
		}

		// Use the reactive senderUsernameMap
		const username = senderUsernameMap.get(senderId);
		if (username) {
			return username;
		}

		return 'Unknown';
	}

	// Get avatar for a message sender from the reactive map
	async function getMessageAvatar(senderId: number): Promise<string | null> {
		if (senderId === currentUserId) {
			return null;
		}

		// Use the reactive senderAvatarMap
		const avatar = senderAvatarMap.get(senderId);
		return avatar || null;
	}

	onMount(() => {
		console.log('ChatView mounted with initialSelectedChatId:', initialSelectedChatId);
		console.log('Current selectedChatId:', selectedChatId);
		console.log('Initial friendStore state:', $friendStore);
		console.log('Initial groupStore state:', $groupStore);

		// Set initial dimensions
		innerWidth = window.innerWidth;
		innerHeight = window.innerHeight;

		// Add resize listener
		window.addEventListener('resize', handleResize);

		// Setup back button capture
		setupBackButtonCapture();
		window.addEventListener('popstate', handlePopState);

		// Get current user ID
		const unsubscribeAuth = authStore.subscribe((state) => {
			if (state.user) {
				currentUserId = state.user.id;
			}
		});
		const unsubscribeFriends = friendStore.subscribe(async (storeState) => {
			console.log('friendStore updated:', storeState.loading, storeState.friends.length);
			if (!storeState.loading) {
				for (const friend of storeState.friends) {
					const shouldUpdate = await avatarStore.getShouldUpdateAvatarForUser(friend.friend_id);
					if (shouldUpdate) {
						if (friend.user) {
							const friendUser: User | null = await updateUserAvatar(friend.user);
							if (friendUser) {
								friend.user = friendUser;
								friendStore.updateFriend(friend);
							}
						}
					} else {
						await checkUserAvatar(friend);
					}
				}
			}
		});
		const unsubscribeGroups = groupStore.subscribe(async (storeState) => {
			console.log('groupStore updated:', storeState.loading, storeState.groups.length);
			if (!storeState.loading) {
				for (const group of storeState.groups) {
					const shouldUpdate = await avatarStore.getShouldUpdateGroupAvatarForGroup(group.chat_id);
					if (shouldUpdate) {
						await updateGroupAvatar(group);
					} else {
						await checkGroupAvatar(group);
					}
				}
			}
		});

		const unsubscribeSocket = socketEventStore.subscribe((event) => {
			if (!event) return;
			console.log('Socket event received:', event);
			if (event.type === 'message_received' && event.data) {
				handleIncomingMessageChatOpen(event.data as MessageData);
			}
		});

		return () => {
			unsubscribeAuth();
			unsubscribeFriends();
			unsubscribeGroups();
			unsubscribeSocket();
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('popstate', handlePopState);
		};
	});

	// Get accepted friends with chat as contacts
	$: friendContacts = $friendStore.friends.filter(
		(f) => f.accepted === true && f.chat_id !== null
	) as Contact[];

	// Get groups as contacts
	$: groupContacts = $groupStore.groups as Contact[];

	// Combine all contacts
	$: allContacts = [...friendContacts, ...groupContacts];

	// Track if we've attempted to auto-select a contact
	let autoSelectAttempted = false;

	// Reset auto-select flag when initialSelectedChatId changes
	$: if (initialSelectedChatId !== null) {
		console.log('initialSelectedChatId changed to:', initialSelectedChatId);
		autoSelectAttempted = false;
	}

	// Auto-select contact when initialSelectedChatId changes or contacts load
	$: if (
		initialSelectedChatId &&
		!selectedContact &&
		allContacts.length > 0 &&
		!autoSelectAttempted
	) {
		console.log(
			'Attempting auto-select with initialSelectedChatId:',
			initialSelectedChatId,
			'contacts:',
			allContacts.length
		);
		const contact = allContacts.find((c) => getContactChatId(c) === initialSelectedChatId);
		if (contact) {
			console.log('Found contact for auto-select:', contact);
			selectContact(contact);
			autoSelectAttempted = true;
		} else {
			console.log('No contact found for initialSelectedChatId:', initialSelectedChatId);
		}
	}

	// Also try auto-selection when stores finish loading
	$: if (
		initialSelectedChatId &&
		!selectedContact &&
		!$friendStore.loading &&
		!$groupStore.loading &&
		!autoSelectAttempted
	) {
		console.log(
			'Stores finished loading, attempting auto-select with initialSelectedChatId:',
			initialSelectedChatId
		);
		if (allContacts.length > 0) {
			const contact = allContacts.find((c) => getContactChatId(c) === initialSelectedChatId);
			if (contact) {
				console.log('Found contact for auto-select after stores loaded:', contact);
				selectContact(contact);
				autoSelectAttempted = true;
			} else {
				console.log(
					'No contact found for initialSelectedChatId after stores loaded:',
					initialSelectedChatId
				);
			}
		} else {
			console.log('No contacts available after stores loaded');
		}
	}

	// Scroll to bottom when messages change
	$: if (currentMessages.length > 0 && selectedContact) {
		setTimeout(scrollToBottom, 100);
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') onClose();
		if (e.key === 'Enter' || e.key === ' ') {
			handleOverlayClick(e as unknown as MouseEvent);
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Chat"
>
	<div class="modal-content">
		<div class="chat-sidebar" class:mobile-hidden={!showSidebar}>
			<div class="sidebar-header">
				<h2>Messages</h2>
				<button class="close-btn mobile-only" on:click={onClose} aria-label="Close chat">×</button>
			</div>

			<div class="chats-list">
				<!-- Friends Section -->
				{#if friendContacts.length > 0}
					<div class="section-label">Direct Messages</div>
					{#each friendContacts as contact (contact.chat_id)}
						{@const bgColor = getContactColour(contact) || ''}
						<div
							class="chat-item"
							class:selected={selectedContact &&
								selectedContact.chat_id === contact.chat_id &&
								isFriend(selectedContact)}
							style="--bg: {bgColor}; --text: {getTextColourForBackground(bgColor)}"
							role="button"
							tabindex="0"
							aria-label="Chat with {getContactName(contact)}"
							on:click={() => selectContact(contact)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') selectContact(contact);
							}}
						>
							<div class="avatar">
								{#if getContactAvatar(contact)}
									<img src={getContactAvatar(contact)} alt={getContactName(contact)} />
								{:else}
									<span class="initial">{getInitial(getContactName(contact))}</span>
								{/if}
							</div>
							<div class="info">
								<span class="name">{getContactName(contact)}</span>
							</div>
							{#if getContactUnreadCount(contact) > 0}
								<div class="unread-badge">{getContactUnreadCount(contact)}</div>
							{/if}
						</div>
					{/each}
				{/if}

				<!-- Groups Section -->
				{#if groupContacts.length > 0}
					<div class="section-label" class:with-border={friendContacts.length > 0}>Groups</div>
					{#each groupContacts as contact (contact.chat_id)}
						{@const bgColor = getContactColour(contact) || ''}
						<div
							class="chat-item"
							class:selected={selectedContact &&
								selectedContact.chat_id === contact.chat_id &&
								isGroup(selectedContact)}
							style="--bg: {bgColor}; --text: {getTextColourForBackground(bgColor)}"
							role="button"
							tabindex="0"
							aria-label="Chat in group {getContactName(contact)}"
							on:click={() => selectContact(contact)}
							on:keydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') selectContact(contact);
							}}
						>
							<div class="avatar">
								{#if getContactAvatar(contact)}
									<img src={getContactAvatar(contact)} alt={getContactName(contact)} />
								{:else}
									<span class="initial">{getInitial(getContactName(contact))}</span>
								{/if}
							</div>
							<div class="info">
								<span class="name">{getContactName(contact)}</span>
							</div>
							{#if getContactUnreadCount(contact) > 0}
								<div class="unread-badge">{getContactUnreadCount(contact)}</div>
							{/if}
						</div>
					{/each}
				{/if}

				{#if friendContacts.length === 0 && groupContacts.length === 0}
					<p class="no-chats">
						You don't have any chats yet. Add friends or create a group to start chatting!
					</p>
				{/if}
			</div>
		</div>

		<div
			class="chat-main"
			class:mobile-hidden={!showMessages}
			style="--chat-bg: {selectedColor ||
				'var(--primary-colour)'}; --chat-text: {selectedTextColor ||
				'var(--text-colour-on-primary)'};"
		>
			<div class="chat-header">
				<div class="chat-header-left">
					{#if isMobile && selectedContact}
						<button class="back-btn" on:click={goBackToSidebar} aria-label="Back to chat list">
							<svg
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path d="M19 12H5M12 19l-7-7 7-7" />
							</svg>
						</button>
					{/if}
					{#if selectedContact}
						<div class="chat-header-avatar">
							{#if selectedChatAvatar}
								<img src={selectedChatAvatar} alt={selectedChatName} />
							{:else}
								<span class="initial">{selectedChatInitial}</span>
							{/if}
						</div>
						<h3>{selectedChatName}</h3>
					{:else}
						<h3>Chat</h3>
					{/if}
				</div>
				<button class="close-btn" on:click={onClose}>×</button>
			</div>

			{#if selectedContact}
				<div class="messages">
					{#if $messageStore.loading}
						<div class="loading-messages">
							<div class="spinner"></div>
							<p>Loading messages...</p>
						</div>
					{:else if !getUserDetailsDone}
						<div class="loading-messages">
							<div class="spinner"></div>
							<p>Loading user data...</p>
						</div>
					{:else if currentMessages.length === 0}
						<div class="empty-chat">
							<p>Start a conversation with {selectedChatName}</p>
						</div>
					{:else}
						{#each currentMessages as message (message.id)}
							<MessageItem
								{message}
								{currentUserId}
								getUsername={getMessageUsername}
								getAvatar={getMessageAvatar}
							/>
						{/each}
						<div bind:this={messagesEndRef}></div>
					{/if}
				</div>

				<div class="message-input-container">
					<input
						type="text"
						placeholder="Type a message..."
						bind:value={newMessage}
						on:keydown={handleKeyDown}
						disabled={$messageStore.loading}
					/>
					<div class="attachment-container">
						<button
							class="attachment-btn"
							on:click={toggleAttachmentMenu}
							aria-label="Add attachment"
							title="Add attachment"
						>
							📎
						</button>
						{#if showAttachmentMenu}
							<div class="attachment-menu">
								<button on:click={() => handleAttachmentSelect('document')}>Document</button>
								<button on:click={() => handleAttachmentSelect('photos-videos')}
									>Photos and videos</button
								>
								<button on:click={() => handleAttachmentSelect('camera')}>Camera</button>
								<button on:click={() => handleAttachmentSelect('audio')}>Audio</button>
								<input
									type="file"
									id="file-upload"
									style="display: none;"
									on:change={handleFileUpload}
									accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
									multiple
								/>
							</div>
						{/if}
					</div>
					<button
						class="send-btn"
						on:click={handleSendMessage}
						disabled={!newMessage.trim() || $messageStore.loading}
					>
						Send
					</button>
				</div>
			{:else}
				<div class="placeholder">
					<div class="placeholder-content">
						<span class="placeholder-icon">💬</span>
						<p>Select a friend or group to start chatting</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
	{#if showAttachmentPreview}
		<MediaPreview onSave={handleAttachmentSave} onClose={handleAttachmentClose} />
	{/if}
	{#if showDocumentUpload}
		<DocumentUpload onSave={handleDocumentSave} onClose={handleDocumentClose} />
	{/if}
	{#if showAudioRecorder}
		<AudioRecorder onSave={handleAudioSave} onClose={handleAudioClose} />
	{/if}
	{#if showCameraView}
		<CameraView onSave={handleCameraSave} onClose={handleCameraClose} />
	{/if}
</div>

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 0;
		margin: 0;
	}

	.modal-content {
		background: white;
		width: 90%;
		max-width: 1000px;
		height: 80vh;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		overflow: hidden;
		position: relative;
	}

	.chat-sidebar {
		width: 320px;
		background: #f8f9fa;
		border-right: 1px solid #e9ecef;
		display: flex;
		flex-direction: column;
	}

	.sidebar-header {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		padding: 0 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		height: 63px;
		min-height: 63px;
	}

	.sidebar-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--chat-text, var(--text-colour-on-primary));
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.chats-list {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.section-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: #6c757d;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: 0.5rem 0.5rem 0.25rem;
	}

	.section-label.with-border {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #dee2e6;
	}

	.chat-item {
		position: relative;
		display: flex;
		align-items: center;
		background: var(--bg);
		border-radius: 12px;
		padding: 0.75rem;
		gap: 0.75rem;
		cursor: pointer;
		overflow: hidden;
		margin-bottom: 0.5rem;
		border: 2px solid transparent;
	}

	.chat-item:hover {
		filter: brightness(0.92);
	}

	.chat-item.selected {
		border-color: var(--primary-colour);
		box-shadow: 0 0 0 3px rgba(var(--primary-colour-rgb), 0.2);
	}

	.chat-item:focus-visible {
		outline: 3px solid rgba(255, 255, 255, 0.6);
		outline-offset: 2px;
	}

	.avatar {
		width: 44px;
		height: 44px;
		flex-shrink: 0;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.initial {
		color: var(--text);
		font-weight: 700;
		font-size: 1.1rem;
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.name {
		color: var(--text);
		font-weight: 600;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.unread-badge {
		background-color: #e74c3c;
		color: white;
		min-width: 20px;
		height: 20px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.no-chats {
		text-align: center;
		padding: 2rem;
		color: #6c757d;
		font-style: italic;
	}

	.chat-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: white;
	}

	.chat-header {
		background: var(--chat-bg, var(--primary-colour));
		color: var(--chat-text, var(--text-colour-on-primary));
		padding: 0 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		border-bottom: 1px solid #e9ecef;
		height: 64px;
		min-height: 64px;
	}

	.chat-header-left {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.chat-header-avatar {
		width: 40px;
		height: 40px;
		overflow: hidden;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.chat-header-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.messages {
		flex: 1;
		padding: 1.5rem;
		overflow-y: auto;
		background: #f8f9fa;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.loading-messages {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #6c757d;
		gap: 1rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid var(--chat-bg, var(--primary-colour));
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.empty-chat {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #6c757d;
		text-align: center;
	}

	.empty-chat p {
		margin: 0;
		font-size: 0.95rem;
	}

	.message-input-container {
		padding: 1rem 1.5rem;
		background: white;
		border-top: 1px solid #e9ecef;
		display: flex;
		gap: 0.75rem;
		align-items: center;
		position: relative;
	}

	.message-input-container input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 1px solid #dee2e6;
		border-radius: 24px;
		font-size: 0.95rem;
		outline: none;
	}

	.message-input-container input:focus {
		border-color: var(--chat-bg, var(--primary-colour));
	}

	.message-input-container input:disabled {
		background: #f8f9fa;
		cursor: not-allowed;
	}

	.attachment-container {
		position: relative;
		display: flex;
		align-items: center;
	}

	.attachment-btn {
		padding: 0.75rem;
		background: #f8f9fa;
		border: none;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1rem;
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.attachment-btn:hover {
		background: #e9ecef;
	}

	.attachment-menu {
		position: absolute;
		bottom: 50px;
		left: 0;
		background: white;
		border: 1px solid #dee2e6;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		padding: 0.5rem 0;
		z-index: 1001;
		min-width: 200px;
		display: flex;
		flex-direction: column;
	}

	.attachment-menu button {
		background: none;
		border: none;
		padding: 0.75rem 1.5rem;
		text-align: left;
		cursor: pointer;
		color: #495057;
		font-size: 0.9rem;
	}

	.attachment-menu button:hover {
		background: #f8f9fa;
	}

	.send-btn {
		padding: 0.75rem 1.5rem;
		background: var(--chat-bg, var(--primary-colour));
		color: var(--chat-text, var(--text-colour-on-primary));
		border: none;
		border-radius: 24px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.send-btn:hover:not(:disabled) {
		filter: brightness(0.9);
	}

	.send-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.placeholder {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
	}

	.placeholder-content {
		text-align: center;
		color: #6c757d;
	}

	.placeholder-icon {
		font-size: 3rem;
		display: block;
		margin-bottom: 1rem;
	}

	.placeholder-content p {
		margin: 0;
		font-size: 1rem;
	}

	/* Mobile responsive styles */
	.mobile-hidden {
		display: none !important;
	}

	.back-btn {
		background: none;
		border: none;
		color: var(--chat-text, var(--text-colour-on-primary));
		cursor: pointer;
		padding: 0.5rem;
		margin-right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		width: 36px;
		height: 36px;
		flex-shrink: 0;
	}

	.back-btn:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.back-btn svg {
		width: 20px;
		height: 20px;
	}

	.mobile-only {
		display: none;
	}

	/* Mobile layout adjustments */
	@media (max-width: 767px) {
		.modal-content {
			width: 100%;
			max-width: 100%;
			height: 100vh;
			border-radius: 0;
		}

		.chat-sidebar {
			width: 100%;
		}

		.chat-main {
			width: 100%;
		}

		.chat-sidebar.mobile-hidden,
		.chat-main.mobile-hidden {
			display: none;
		}

		.chat-sidebar:not(.mobile-hidden),
		.chat-main:not(.mobile-hidden) {
			display: flex;
		}

		.mobile-only {
			display: flex;
		}
	}

	/* Desktop layout - always show both */
	@media (min-width: 768px) {
		.mobile-hidden {
			display: flex !important;
		}

		.back-btn {
			display: none;
		}
	}
</style>
