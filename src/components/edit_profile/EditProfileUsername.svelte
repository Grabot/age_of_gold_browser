<script lang="ts">
	import { get } from 'svelte/store';
	import { userDetail } from '$lib/stores/authStore';

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
	aria-label="Edit Username"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Edit Username</h2>
			<button class="close-btn" on:click={onClose}>x</button>
		</div>
		<div class="modal-body-scrollable">
			<div class="form-group">
				<label for="username">Username</label>
				<input
					type="text"
					id="username"
					bind:value={newUsername}
					class="field-input"
					bind:this={usernameInput}
					on:keydown={(e) => e.key === 'Enter'}
				/>
			</div>
		</div>
		<div class="modal-footer">
			<div class="modal-actions">
				{#if hasChanges}
					<button on:click={handleSave}>Save</button>
				{/if}
				<button on:click={onClose}>Cancel</button>
			</div>
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
        width: 90%;
        max-width: 400px;
        max-height: 400px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
    }

    .modal-header {
        background: var(--primary-colour);
        color: var(--text-colour-on-primary);
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        font-size: 1.5rem;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-colour-on-primary);
        font-size: 1.5rem;
        cursor: pointer;
    }

    .modal-body-scrollable {
        overflow-y: auto;
        padding: 1rem;
        flex: 1;
    }

    .form-group {
        margin-bottom: 1rem;
    }

    .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }

    .field-input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
    }

    .modal-footer {
        padding: 1rem 1.5rem;
        border-top: 1px solid #eee;
        text-align: right;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .modal-actions button {
        background: var(--primary-colour);
        color: var(--text-colour-on-primary);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .modal-actions button:hover:not(:disabled) {
        background: var(--primary-colour-dark);
    }

    .modal-actions button:last-child {
        background: #e74c3c;
    }

    .modal-actions button:last-child:hover:not(:disabled) {
        background: #c0392b;
    }
	.modal-content h2 {
		margin-top: 0;
		color: #2c3e50;
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
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
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
