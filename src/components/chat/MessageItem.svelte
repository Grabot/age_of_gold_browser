<script lang="ts">
import { formatUTCToLocalTime } from '$lib/utils/dateUtils';
import type { Message } from '$lib/types/message';
import { accessTokenValue } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import { errorToast } from '$lib/utils/toast';
import { getMessageData } from '$lib/api/messageApi';
import { indexedDBHelper } from '$lib/stores/indexedDBHelper';

	export let message: Message;
	export let currentUserId: number | null;
	export let getUsername: (senderId: number) => Promise<string>;
	export let getAvatar: (senderId: number) => Promise<string | null>;

	// Get sender info from group members or message
	let username: string = '';
	let avatar: string | null = null;
	let isMe = message.sender_id === currentUserId;
	let showMedia = false; // Track whether media attachment is visible

	onMount(async () => {
		console.log('message loaded');
		const cachedBlob = await indexedDBHelper.getMessageBlob(message.chat_id, message.id);
		console.log("Cached blob:", cachedBlob);
		if (cachedBlob) {
			console.log('Using cached blob for message:', message.chat_id, message.id);
			// Create blob URL from cached blob
			const blobUrl = URL.createObjectURL(cachedBlob);
			message.data = blobUrl;
		}
	});

	function toggleMediaVisibility() {
		if (message.message_type === 0) return; // Don't handle text messages
		
		// If data already exists, just toggle visibility
		if (message.data) {
			showMedia = !showMedia;
		} else {
			// If no data, download it
			handleMessageClick();
		}
	}

	// Cleanup blob URLs when component is destroyed
	function cleanupBlobUrls() {
		if (message.data && message.data.startsWith('blob:')) {
			URL.revokeObjectURL(message.data);
		}
	}

	// Lifecycle: Clean up blob URLs when component is destroyed
	import { onDestroy, onMount } from 'svelte';
	onDestroy(cleanupBlobUrls);

	async function handleMessageClick() {
		if (message.message_type === 0) return; // Don't handle text messages

			// If message already has data, just toggle visibility
			if (message.data) {
				showMedia = !showMedia;
				return;
			}

		// Otherwise, download the media data
		try {
			const accessToken = get(accessTokenValue);
			if (!accessToken) {
				errorToast('Not authenticated');
				return;
			}

			// First check if media is cached in IndexedDB
			const cachedBlob = await indexedDBHelper.getMessageBlob(message.chat_id, message.id);
			console.log("Cached blob:", cachedBlob);
			if (cachedBlob) {
				console.log('Using cached blob for message:', message.chat_id, message.id);
				// Create blob URL from cached blob
				const blobUrl = URL.createObjectURL(cachedBlob);
				message.data = blobUrl;
				showMedia = true;
				return;
			}

			// If not cached, download from server
			const response = await getMessageData(accessToken, message.chat_id, message.id);
			console.log('Download response:', response);
			if (response.success && response.data) {
				// Store the actual blob in IndexedDB for persistent caching
				await indexedDBHelper.saveMessageBlob(message.chat_id, message.id, response.data);
				
				// Create blob URL from the downloaded blob
				const blobUrl = URL.createObjectURL(response.data);
				console.log("Blob URL created:", blobUrl);
				
				// Update the message with the blob URL
				message.data = blobUrl;
				
				// Show the media
				showMedia = true;
			} else {
				errorToast('Failed to download message data');
			}
		} catch (error) {
			console.error('Error downloading message data:', error);
			errorToast('Error downloading message data');
		}
	}

	// Load username and avatar asynchronously
	async function loadSenderInfo() {
		if (message.sender_id !== currentUserId) {
			username = await getUsername(message.sender_id);
			avatar = await getAvatar(message.sender_id);
		}
	}

	// Reactive statement to reload when message changes
	$: if (message) {
		isMe = message.sender_id === currentUserId;
		loadSenderInfo();
	}

</script>

<div class="message {isMe ? 'me' : 'other'}">
	{#if !isMe && username && username !== 'Unknown'}
		<div class="message-sender">
			{#if avatar}
				<div class="sender-avatar">
					<img src={avatar} alt={username} />
				</div>
			{:else}
				<div class="sender-avatar">
					<span class="initial">{username.charAt(0).toUpperCase()}</span>
				</div>
			{/if}
			<span class="sender-name">{username}</span>
		</div>
	{/if}
	{#if message.message_type !== 0}
			<div
				class="message-bubble"
				on:click={toggleMediaVisibility}
				on:keydown={(e) => e.key === 'Enter' || e.key === ' ' ? toggleMediaVisibility() : null}
				role="button"
				tabindex="0"
				aria-label={showMedia ? 'Hide media attachment' : 'Show media attachment'}
				aria-pressed={showMedia}
			>
			<div class="message-content">
				{message.content}
			</div>
			{#if !message.data && message.message_type !== 0}
				<div class="download-indicator">
					<button class="download-button" on:click|stopPropagation={toggleMediaVisibility}>
						📥
					</button>
				</div>
			{/if}
				{#if showMedia && message.data}
					<div class="message-media-container">
						{#if message.message_type === 1} <!-- Image -->
							<img src={message.data} alt="Message attachment" class="message-media" />
						{:else if message.message_type === 2} <!-- Video -->
							<video src={message.data} controls class="message-media"></video>
						{:else if message.message_type === 3} <!-- Document -->
							<a href={message.data} target="_blank" rel="noopener noreferrer" class="message-document">
								📄 {message.content || 'Document'}
							</a>
						{:else if message.message_type === 4} <!-- Audio -->
							<audio src={message.data} controls class="message-media"></audio>
						{/if}
					</div>
				{/if}
				<!-- TODO: Media, when available? -->
			</div>
	{:else}
		<div class="message-bubble">
			{message.content}
		</div>
	{/if}
	<div class="message-time">
		{formatUTCToLocalTime(message.created_at)}
	</div>
</div>

<style>
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
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		z-index: 1;
	}

	.message-bubble:hover {
		filter: brightness(0.95);
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



	/* Media elements styling */
	.message-media {
		max-width: 100%;
		max-height: 300px;
		border-radius: 8px;
		object-fit: contain;
	}

	.message-document {
		color: #4285f4;
		text-decoration: none;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.message-document:hover {
		text-decoration: underline;
	}

	/* Video accessibility fix */
	video {
		width: 100%;
		max-height: 300px;
	}

	/* Media attachment styling */
	.message-content {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.download-indicator {
		margin-top: 6px;
		font-size: 0.85em;
		color: #6c757d;
	}

	.download-button {
		background: none;
		border: none;
		color: #4285f4;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.85em;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		text-decoration: none;
	}

	.download-button:hover {
		background: rgba(66, 133, 244, 0.1);
		text-decoration: underline;
	}

	.message-media-container {
		margin-top: 8px;
		max-width: 100%;
	}

	.message-media-container img,
	.message-media-container video {
		max-width: 100%;
		max-height: 300px;
		border-radius: 8px;
		object-fit: contain;
		background: #f8f9fa;
		padding: 4px;
	}

	.message-time {
		font-size: 0.7rem;
		color: #6c757d;
		margin-top: 0.25rem;
		padding: 0 0.5rem;
	}

	.message-sender {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.25rem;
		padding: 0 0.5rem;
	}

	.sender-avatar {
		width: 24px;
		height: 24px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		font-size: 0.75rem;
		font-weight: 600;
	}

	.sender-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.sender-name {
		font-size: 0.75rem;
		color: #6c757d;
		font-weight: 500;
	}
</style>
