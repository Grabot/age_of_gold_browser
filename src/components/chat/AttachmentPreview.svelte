<script lang="ts">
	import { errorToast } from '$lib/utils/toast';

	export let onSave: (data: { file?: File | null; caption?: string | null }) => void;
	export let onClose: () => void;

	let imagePreview: string | null = null;
	let isUploading = false;
	let isDragging = false;
	let caption = '';
	let filename = '';
	let selectedFile: File | null = null;

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !isUploading) {
			onClose();
		}
	}

	function handleSave() {
		if (!selectedFile) return;

		const data: { file?: File | null; caption?: string | null } = {};
		data.file = selectedFile;
		data.caption = caption || null;
		onSave(data);
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			if (file.type.startsWith('image/')) {
				filename = file.name;
				selectedFile = file;
				const reader = new FileReader();
				reader.onload = (e) => {
					imagePreview = e.target?.result as string;
				};
				reader.readAsDataURL(file);
			} else {
				errorToast('Please select an image file');
			}
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			const file = event.dataTransfer.files[0];
			if (file.type.startsWith('image/')) {
				filename = file.name;
				selectedFile = file;
				const reader = new FileReader();
				reader.onload = async (e) => {
					imagePreview = e.target?.result as string;
				};
				reader.readAsDataURL(file);
			} else {
				errorToast('Please drop an image file');
			}
		}
	}

	let fileInput: HTMLInputElement;
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
	aria-label="Attachment Preview"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Attachment Preview</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="attachment-section">
			<div class="attachment-preview-container">
				<div
					class="preview-area"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					class:dragging={isDragging}
					class:has-image={!!imagePreview}
					role="region"
					aria-label="Attachment preview area"
				>
					{#if imagePreview}
						<img src={imagePreview} alt="Attachment Preview" class="attachment-image" />
					{:else}
						<div class="empty-preview">
							<p>Drag and drop an image here or click browse</p>
						</div>
					{/if}
				</div>

				<div class="caption-section">
					<textarea placeholder="Add a caption..." bind:value={caption} class="caption-input"
					></textarea>
				</div>

				<div
					class="attachment-upload"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					on:dragenter={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					class:dragging={isDragging}
					role="region"
					aria-label="Attachment upload area"
				>
					<input
						type="file"
						on:change={handleFileInput}
						accept="image/*"
						class="field-input"
						style="display: none;"
						bind:this={fileInput}
					/>
					<input
						type="text"
						class="filename-input"
						value={filename}
						readonly
						placeholder="No file chosen"
					/>
					<button type="button" class="browse-button" on:click={() => fileInput.click()}>
						Browse...
					</button>
				</div>
			</div>
		</div>
		<div class="modal-footer">
			<div class="modal-actions">
				<button on:click={handleSave} disabled={isUploading || !selectedFile}>Send</button>
				<button on:click={onClose} disabled={isUploading}>Cancel</button>
			</div>
		</div>
	</div>

	{#if isUploading}
		<div
			class="spinner-overlay"
			role="alertdialog"
			aria-label="Uploading in progress"
			aria-busy="true"
			aria-live="assertive"
		>
			<div class="spinner-container">
				<div class="spinner" role="status"></div>
				<p>Uploading attachment...</p>
				<p>Please wait...</p>
			</div>
		</div>
	{/if}
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
		width: 92%;
		max-width: 500px;
		max-height: 92vh;
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
		padding: 0.8rem 1.2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.3rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--text-colour-on-primary);
		font-size: 1.5rem;
		cursor: pointer;
	}

	.attachment-section {
		padding: 1rem 1.2rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.attachment-preview-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
	}

	.preview-area {
		width: 100%;
		aspect-ratio: 16/9;
		max-width: 400px;
		max-height: 300px;
		border: 2px dashed #ddd;
		border-radius: 4px;
		overflow: hidden;
		position: relative;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f9f9f9;
	}

	.preview-area.dragging {
		border-color: var(--primary-colour);
		background: rgba(var(--primary-colour-light), 0.1);
	}

	.preview-area.has-image {
		border-style: solid;
		background: white;
	}

	.attachment-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		max-width: 100%;
		max-height: 100%;
	}

	.empty-preview {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		color: #7f8c8d;
		font-size: 0.9rem;
		text-align: center;
		padding: 1rem;
		border: 1px dashed #bdc3c7;
	}

	.caption-section {
		width: 100%;
		max-width: 400px;
		margin-top: 0.5rem;
	}

	.caption-input {
		width: 100%;
		min-height: 60px;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		resize: vertical;
		font-family: inherit;
	}

	.attachment-upload {
		width: 100%;
		max-width: 400px;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		margin-top: 0.8rem;
		border: 2px dashed transparent;
		padding: 0.5rem;
		border-radius: 4px;
	}

	.attachment-upload.dragging {
		border-color: var(--primary-colour);
		background: rgba(var(--primary-colour-light), 0.1);
	}

	.filename-input {
		flex-grow: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
		text-align: left;
		background: white;
	}

	.browse-button {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.browse-button:hover {
		background: var(--primary-colour-dark);
	}

	.modal-footer {
		padding: 0.8rem 1.2rem;
		border-top: 1px solid #eee;
		text-align: right;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0;
	}

	.modal-actions button {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
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

	.modal-actions button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.spinner-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 101;
		pointer-events: auto;
	}

	.spinner-container {
		text-align: center;
		color: var(--text-colour-on-primary);
		background: rgba(0, 0, 0, 0.8);
		padding: 1.5rem;
		border-radius: 8px;
	}

	.spinner {
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top: 4px solid var(--primary-colour);
		width: 40px;
		height: 40px;
		animation: spin 1s linear infinite;
		margin: 0 auto 0.8rem;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
