<script lang="ts">
	import { errorToast } from '$lib/utils/toast';

	export let onSave: (data: { file?: File | null; filename: string }) => void;
	export let onClose: () => void;

	let isUploading = false;
	let isDragging = false;
	let selectedFile: File | null = null;
	let filename = '';

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !isUploading) {
			onClose();
		}
	}

	function handleSave() {
		if (!selectedFile) return;

		const data: { file?: File | null; filename: string } = {
			file: selectedFile,
			filename: selectedFile.name
		};
		onSave(data);
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			selectedFile = file;
			filename = file.name;
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
			selectedFile = file;
			filename = file.name;
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
	aria-label="Document Upload"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Upload Document</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="upload-section">
			<div class="upload-container">
				<div
					class="drop-area"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					on:dragenter={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					class:dragging={isDragging}
					role="region"
					aria-label="Document upload area"
				>
					{#if filename}
						<div class="file-selected">
							<p>📄 {filename}</p>
							<p class="file-size">File ready to upload</p>
						</div>
					{:else}
						<div class="upload-instructions">
							<p>📁 Drag and drop files here</p>
							<p class="or-text">or</p>
							<button type="button" class="browse-button" on:click={() => fileInput.click()}>
								Browse Files
							</button>
						</div>
					{/if}
				</div>

				<input
					type="file"
					on:change={handleFileInput}
					accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
					class="field-input"
					style="display: none;"
					bind:this={fileInput}
				/>
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
				<p>Uploading document...</p>
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

	.upload-section {
		padding: 1rem 1.2rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.upload-container {
		width: 100%;
		max-width: 400px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.drop-area {
		width: 100%;
		min-height: 200px;
		border: 2px dashed #ddd;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		text-align: center;
		padding: 1.5rem;
		background: #f9f9f9;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.drop-area.dragging {
		border-color: var(--primary-colour);
		background: rgba(var(--primary-colour-light), 0.1);
	}

	.drop-area:hover {
		border-color: var(--primary-colour);
		background: rgba(var(--primary-colour-light), 0.05);
	}

	.upload-instructions {
		color: #666;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.upload-instructions p {
		margin: 0;
		font-size: 1rem;
	}

	.or-text {
		font-size: 0.9rem;
		color: #999;
		margin: 0.5rem 0;
	}

	.browse-button {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 500;
		transition: background 0.2s ease;
	}

	.browse-button:hover {
		background: var(--primary-colour-dark);
	}

	.file-selected {
		color: #2c3e50;
		text-align: center;
	}

	.file-selected p {
		margin: 0;
		font-size: 1.1rem;
		font-weight: 500;
		word-break: break-all;
	}

	.file-size {
		font-size: 0.9rem;
		color: #7f8c8d;
		margin-top: 0.5rem;
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
