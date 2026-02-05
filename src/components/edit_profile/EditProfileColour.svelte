<script lang="ts">
	import { userDetail } from '$lib/stores/authStore';
	import { get } from 'svelte/store';
	import ColourPicker from '$lib/components/ColourPicker.svelte';

	export let onSave: (data: { colour: string }) => void;
	export let onClose: () => void;
	export let initialColour: string = get(userDetail).colour;

	let selectedColour: string = initialColour;

	function handleColourChange(colour: string) {
		selectedColour = colour;
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleSave() {
		onSave({ colour: selectedColour });
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') {
			onClose();
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Colour Picker"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Choose Colour</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="modal-body-scrollable">
			<ColourPicker 
				initialColour={initialColour} 
				onColourChange={handleColourChange}
			/>
		</div>
		<div class="modal-footer">
			<div class="modal-actions">
				<button on:click={handleSave}>Save</button>
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
		max-height: 90vh;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.modal-header {
		background: var(--primary-colour, #3498db);
		color: var(--text-colour-on-primary, white);
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
		color: var(--text-colour-on-primary, white);
		font-size: 1.5rem;
		cursor: pointer;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
	}

	.close-btn:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.modal-body-scrollable {
		overflow-y: auto;
		padding: 2rem 1rem;
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #eee;
	}

	.modal-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
	}

	.modal-actions button {
		background: #47db34;
		color: var(--text-colour-on-primary, white);
		border: none;
		padding: 0.5rem 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
	}

	.modal-actions button:hover:not(:disabled) {
		background: #19af06;
	}

	.modal-actions button:last-child {
		background: #e74c3c;
	}

	.modal-actions button:last-child:hover:not(:disabled) {
		background: #c0392b;
	}
</style>
