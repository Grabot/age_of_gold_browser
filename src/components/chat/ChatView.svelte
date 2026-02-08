<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import { friendStore } from '$lib/stores/friendStore';
	import { messageStore } from '$lib/stores/messageStore';
	import { accessTokenValue, authStore } from '$lib/stores/authStore';
	import { getInitial } from '$lib/utils/groupUtils';
	import { getTextColourForBackground } from '$lib/utils/colourUtils';
	import type { Contact } from '$lib/types/contact';
	import { 
		isGroup, 
		isFriend, 
		getContactId, 
		getContactName, 
		getContactAvatar, 
		getContactColour, 
		getContactChatId,
		getContactUnreadCount
	} from '$lib/types/contact';
	import type { ChatMessage } from '$lib/types/message';
	import { onMount } from 'svelte';
	import { pushState } from '$app/navigation';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { updateGroupAvatar, updateUserAvatar, checkUserAvatar, checkGroupAvatar } from '$lib/utils/avatarUtils';
	import { errorToast } from '$lib/utils/toast';
	import { fetchMessages, sendMessage, type FetchMessagesResponse, type SendMessageResponse } from '$lib/api/messageApi';
	import { get } from 'svelte/store';
	import type { User } from '$lib/types/user';

	export let onClose: () => void;

	let selectedContact: Contact | null = null;
	let newMessage = '';
	let currentUserId: number | null = null;
	let messagesEndRef: HTMLDivElement | null = null;
	let innerWidth = window.innerWidth;
	let innerHeight = window.innerHeight;
	let showSidebarOnMobile = true;

	// Reactive mobile detection (portrait orientation or narrow viewport)
	$: isMobile = innerWidth < 768 || innerHeight > innerWidth;
	$: showSidebar = !isMobile || showSidebarOnMobile;
	$: showMessages = !isMobile || !showSidebarOnMobile;

	// Reactive variables for selected contact properties - these update automatically when selectedContact changes
	$: selectedChatId = selectedContact ? getContactChatId(selectedContact) : null;
	$: selectedColor = selectedContact ? (getContactColour(selectedContact) || '') : null;
	$: selectedTextColor = selectedColor ? getTextColourForBackground(selectedColor) : null;
	$: selectedChatName = selectedContact ? getContactName(selectedContact) : 'Chat';
	$: selectedChatAvatar = selectedContact ? getContactAvatar(selectedContact) : undefined;
	$: selectedChatInitial = selectedContact ? getInitial(getContactName(selectedContact)) : '';

	// Helper function for getting chat ID (used in non-reactive contexts)
	function getChatId(): number | null {
		return selectedChatId;
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
		// Load avatar if not available
		await loadContactAvatar(contact);
		
		// Force update by creating new object reference
		selectedContact = { ...contact };
		
		// On mobile, switch to messages view
		if (isMobile) {
			showSidebarOnMobile = false;
		}
		
		await loadMessages();
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

	async function loadMessages() {
		console.log("loading messages");
		const chatId = getChatId();
		const accessToken = get(accessTokenValue);
		
		if (!chatId || !currentUserId || !accessToken) return;
		
		messageStore.setLoading(true);
		const response: FetchMessagesResponse = await fetchMessages(
			accessToken,
			chatId,
			currentUserId
		);
		
		if (!response.success) {
			errorToast("Failed to fetch messages");
			messageStore.setLoading(false);
			return;
		}
		
		console.log('Messages fetched:', response.data);
		const chatMessages: ChatMessage[] = response.data.messages.map(msg => ({
			...msg,
			is_me: msg.sender_id === currentUserId
		}));
		messageStore.addMessages(chatId, chatMessages);
		messageStore.setLoading(false);
		setTimeout(scrollToBottom, 100);
	}

	async function handleSendMessage() {
		const accessToken = get(accessTokenValue);
		const chatId = getChatId();
		
		if (newMessage.trim() && chatId && currentUserId && accessToken) {
			const response: SendMessageResponse = await sendMessage(
				accessToken,
				chatId,
				newMessage.trim(),
			);
			if (!response.success) {
				errorToast("Failed to send message");
				return;
			}
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

	onMount(() => {
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

		return () => {
			unsubscribeAuth();
			unsubscribeFriends();
			unsubscribeGroups();
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('popstate', handlePopState);
		};
	});

	// Get accepted friends with chat as contacts
	$: friendContacts = $friendStore.friends
		.filter(f => f.accepted === true && f.chat_id !== null) as Contact[];
	
	// Get groups as contacts
	$: groupContacts = $groupStore.groups as Contact[];

	$: currentMessages = selectedChatId 
		? ($messageStore.messages.get(selectedChatId) || [])
		: [];
	
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
					{#each friendContacts as contact (getContactId(contact))}
						{@const bgColor = getContactColour(contact) || ''}
						<div
							class="chat-item"
							class:selected={selectedContact && getContactId(selectedContact) === getContactId(contact) && isFriend(selectedContact)}
							style="--bg: {bgColor}; --text: {getTextColourForBackground(bgColor)}"
							role="button"
							tabindex="0"
							aria-label="Chat with {getContactName(contact)}"
							on:click={() => selectContact(contact)}
							on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectContact(contact); }}
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
						</div>
					{/each}
				{/if}
				
				<!-- Groups Section -->
				{#if groupContacts.length > 0}
					<div class="section-label" class:with-border={friendContacts.length > 0}>Groups</div>
					{#each groupContacts as contact (getContactId(contact))}
						{@const bgColor = getContactColour(contact) || ''}
						<div
							class="chat-item"
							class:selected={selectedContact && getContactId(selectedContact) === getContactId(contact) && isGroup(selectedContact)}
							style="--bg: {bgColor}; --text: {getTextColourForBackground(bgColor)}"
							role="button"
							tabindex="0"
							aria-label="Chat in group {getContactName(contact)}"
							on:click={() => selectContact(contact)}
							on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectContact(contact); }}
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
					<p class="no-chats">You don't have any chats yet. Add friends or create a group to start chatting!</p>
				{/if}
			</div>
		</div>

		<div class="chat-main" class:mobile-hidden={!showMessages} style="--chat-bg: {selectedColor || 'var(--primary-colour)'}; --chat-text: {selectedTextColor || 'var(--text-colour-on-primary)'};">
			<div class="chat-header">
				<div class="chat-header-left">
					{#if isMobile && selectedContact}
						<button class="back-btn" on:click={goBackToSidebar} aria-label="Back to chat list">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M19 12H5M12 19l-7-7 7-7"/>
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
					{:else if currentMessages.length === 0}
						<div class="empty-chat">
							<p>Start a conversation with {selectedChatName}</p>
						</div>
					{:else}
						{#each currentMessages as message (message.id)}
							<div class="message {message.is_me ? 'me' : 'other'}">
								<div class="message-bubble">
									{message.content}
								</div>
								<div class="message-time">
									{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</div>
							</div>
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
					<button class="send-btn" on:click={handleSendMessage} disabled={!newMessage.trim() || $messageStore.loading}>
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
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
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

	.message {
		display: flex;
		flex-direction: column;
	}

	.message.me {
		align-items: flex-end;
	}

	.message.other {
		align-items: flex-start;
	}

	.message-bubble {
		max-width: 70%;
		padding: 0.75rem 1rem;
		border-radius: 18px;
		font-size: 0.95rem;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.message.me .message-bubble {
		background: var(--chat-bg, var(--primary-colour));
		color: var(--chat-text, var(--text-colour-on-primary));
		border-bottom-right-radius: 4px;
	}

	.message.other .message-bubble {
		background: white;
		color: #212529;
		border-bottom-left-radius: 4px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}

	.message-time {
		font-size: 0.7rem;
		color: #6c757d;
		margin-top: 0.25rem;
		padding: 0 0.5rem;
	}

	.message-input-container {
		padding: 1rem 1.5rem;
		background: white;
		border-top: 1px solid #e9ecef;
		display: flex;
		gap: 0.75rem;
		align-items: center;
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