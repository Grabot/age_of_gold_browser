<script lang="ts">
	import { groupStore } from '$lib/stores/groupStore';
	import { errorToast, successToast } from '$lib/utils/toast';
	import type { Group } from '$lib/types/groups';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { getTextColorForBackground } from '$lib/utils/groupUtils';

	export let group: Group;
	export let onClose: () => void;
	export let onSave: (updatedGroup: {
		groupName: string;
		groupDescription: string;
		groupColour: string;
	}) => void;

	export let textColor: string = 'white';

	let editGroupName: string = '';
	let editGroupDescription: string = '';
	let editGroupColour: string = '';

	$: {
		textColor = getTextColorForBackground(editGroupColour);
	}

	// Initialize form fields when group changes
	$: {
		editGroupName = group.group_name || '';
		editGroupDescription = group.group_description || '';
		editGroupColour = group.group_colour || '#0b9476';
	}

	async function handleSave() {
		try {
			const updatedGroup = {
				groupName: editGroupName.trim(),
				groupDescription: editGroupDescription.trim(),
				groupColour: editGroupColour
			};
			onSave(updatedGroup);
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
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
	aria-label="Edit Group"
>
	<div class="modal-content">
		<div
			class="modal-header"
			style="background-color: {group.group_colour || '#0b9476'}; color: {textColor};"
		>
			<h3>Edit Group</h3>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>

		<div class="modal-body">
			<form on:submit|preventDefault={handleSave} class="edit-group-form">
				<div class="form-group">
					<label for="editGroupName">Group Name</label>
					<input
						id="editGroupName"
						type="text"
						bind:value={editGroupName}
						required
						class="form-input"
					/>
				</div>

				<div class="form-group">
					<label for="editGroupDescription">Description</label>
					<textarea
						id="editGroupDescription"
						bind:value={editGroupDescription}
						class="form-textarea"
					></textarea>
				</div>

				<div class="form-group">
					<label for="editGroupColour">Group Color</label>
					<ColorPicker bind:hex={editGroupColour} />
				</div>

				<div class="form-actions">
					<button
						type="submit"
						class="save-btn"
						style="background-color: {group.group_colour || '#0b9476'}; color: {textColor};"
						>Save Changes</button
					>
					<button type="button" class="cancel-btn" on:click={() => onClose()}>Cancel</button>
				</div>
			</form>
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
		z-index: 1002;
	}

	.modal-content {
		background: white;
		width: 90%;
		max-width: 500px;
		max-height: 80vh;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		position: relative;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 12px 12px 0 0;
		margin: 0;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-body {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.edit-group-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.form-group label {
		font-weight: 500;
		color: #333;
		font-size: 0.9rem;
	}

	.form-input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		transition: border-color 0.2s;
	}

	.form-input:focus {
		outline: none;
		border-color: #0b9476;
	}

	.form-textarea {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		min-height: 100px;
		resize: vertical;
		font-family: inherit;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.save-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: filter 0.2s;
	}

	.save-btn:hover {
		filter: brightness(0.9);
	}

	.cancel-btn {
		padding: 0.75rem 1.5rem;
		background-color: #f5f5f5;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: background-color 0.2s;
	}

	.cancel-btn:hover {
		background-color: #e0e0e0;
	}
</style>
