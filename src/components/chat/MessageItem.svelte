<script lang="ts">
	import { formatUTCToLocalTime } from '$lib/utils/dateUtils';
	import type { ChatMessage } from '$lib/types/message';

	export let message: ChatMessage;
	export let currentUserId: number | null;
	export let getUsername: (senderId: number) => Promise<string>;
	export let getAvatar: (senderId: number) => Promise<string | null>;

	// Get sender info from group members or message
	let username: string = '';
	let avatar: string | null = null;
	let isMe = message.sender_id === currentUserId;

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
	<div class="message-bubble">
		{message.content}
	</div>
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
