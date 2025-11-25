<script lang="ts">
	import { get } from 'svelte/store';
	import { userDetail } from '../../stores/authStore';

	export let onSave: (data: { username?: string }) => void;
	export let onClose: () => void;

	let newUsername = get(userDetail).username;
	let usernameInput: HTMLInputElement;
	const originalUsername = get(userDetail).username;

	$: hasChanges = newUsername !== originalUsername;

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleSave() {
		const data: { username?: string } = {};
		if (newUsername !== originalUsername) {
			data.username = newUsername;
		}
		onSave(data);
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleOverlayClick(e as unknown as MouseEvent);
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
>
	<div class="modal-content">
		<h2>Edit Profile</h2>
		<!-- Username Section -->
		<div class="username-section">
			<input
				type="text"
				bind:value={newUsername}
				class="field-input"
				bind:this={usernameInput}
				on:keydown={(e) => e.key === 'Enter'}
			/>
		</div>
		<div class="modal-actions">
			{#if hasChanges}
				<button on:click={handleSave}> Save </button>
			{/if}
			<button on:click={onClose}>Cancel</button>
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
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 90%;
		max-width: 400px;
		text-align: center;
		position: relative;
	}
	.modal-content h2 {
		margin-top: 0;
		color: #2c3e50;
	}
	.username-section {
		position: relative;
		display: flex;
		justify-content: center;
		margin: 1.5rem auto;
	}
	.field-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		text-align: center;
	}
	.modal-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
	.modal-actions button {
		background: #3498db;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}
	.modal-actions button:hover {
		background: #2980b9;
	}
	.modal-actions button:last-child {
		background: #e74c3c;
	}
	.modal-actions button:last-child:hover {
		background: #c0392b;
	}
</style>
