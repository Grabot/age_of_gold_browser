<script lang="ts">
	export let onClose: () => void;
	export let contacts: Array<{ id: string; name: string; type: 'user' | 'group' }> = [
		{ id: 'world', name: 'World Global Chat', type: 'group' }
	];
	export let selectedContact: { id: string; name: string; type: 'user' | 'group' } | null = {
		id: 'world',
		name: 'World Global Chat',
		type: 'group'
	};
	export let messages: Array<{ id: string; text: string; sender: 'me' | 'other' }> = [];

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function selectContact(contact: typeof selectedContact) {
		selectedContact = contact;
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
		<div class="chat-sidebar">
			<h3>Chats</h3>
			<ul class="contact-list">
						{#each contacts as contact (contact.id)}
							<li>
								<button
									class:selected={selectedContact?.id === contact.id}
									on:click={() => selectContact(contact)}
									on:keydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') selectContact(contact);
									}}
									tabindex="0"
									aria-label={`Select ${contact.name}`}
							>
								{contact.name}
								{contact.type === 'group' ? '(Group)' : ''}
							</button>
						</li>
						{/each}
			</ul>
		</div>
		<div class="chat-main">
			{#if selectedContact}
				<h2>{selectedContact.name}</h2>
					<div class="messages">
						{#each messages as message (message.id)}
							<div class={message.sender}>
								{message.text}
							</div>
						{/each}
					</div>
				<div class="message-input">
					<input type="text" placeholder="Type a message..." />
					<button>Send</button>
				</div>
			{:else}
				<div class="placeholder">Select a chat to start chatting</div>
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
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		border: none;
		padding: 0;
		margin: 0;
		cursor: default;
	}
	.modal-content {
		background: white;
		padding: 0;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 90%;
		max-width: 1000px;
		height: 80vh;
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.chat-sidebar {
		width: 20%;
		background: #f5f5f5;
		padding: 1rem;
		overflow-y: auto;
		border-right: 1px solid #ddd;
	}
	.chat-main {
		width: 80%;
		display: flex;
		flex-direction: column;
	}
	.contact-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.contact-list li {
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
	}
	.contact-list li:hover {
		background: #e0e0e0;
	}
	.messages {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
	}
	.message-input {
		padding: 1rem;
		display: flex;
		gap: 0.5rem;
	}
	.message-input input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
	}
	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		color: #999;
	}
	.me {
		text-align: right;
		color: blue;
		margin: 0.5rem;
	}
	.other {
		text-align: left;
		color: green;
		margin: 0.5rem;
	}
</style>
