<script lang="ts">
	import { get } from 'svelte/store';
	import { accessTokenValue } from '$lib/stores/authStore';
	import Cropper from 'svelte-easy-crop';
	import { handleGetGroupAvatar } from '$lib/services/settingsService';
	import { onDestroy, onMount } from 'svelte';
	import { errorToast } from '$lib/utils/toast';
	import { avatarStore } from '$lib/stores/avatarStore';
	import { getTextColorForBackground } from '$lib/utils/groupUtils';
	import { updateGroupAvatar } from '$lib/utils/avatarUtils';
	import type { Group } from '$lib/types/groups';

	export let onSave: (data: { avatar?: File | null; defaultAvatar?: boolean | null }) => void;
	export let onClose: () => void;
	export let groupId: number;
	export let groupAvatar: string | undefined;
	export let groupColor: string = '#0b9476';
	export let textColor: string = 'white';
	export let group: Group;
	$: {
		textColor = getTextColorForBackground(groupColor);
	}

	let resetDefault = false;
	let defaultAvatar = false;
	let imageToCrop: string = '';
	let croppedImage: string | null = imageToCrop;
	let isResizing = false;
	let worker: Worker;
	let isDragging = false;
	let latestCropPixels: { x: number; y: number; width: number; height: number } | null = null;
	let debounceTimer: ReturnType<typeof setTimeout>;

	onMount(async () => {
		const SyncWorker = await import('$lib/workers/resize.worker?worker');
		worker = new SyncWorker.default();
		worker.onmessage = (e) => {
			isResizing = false;
			if (e.data.msg.type === 'resize') {
				const finalBlob = dataURLtoBlob(e.data.msg.result);
				const file = new File([finalBlob], 'cropped-avatar.png', { type: 'image/png' });
				const data: { avatar?: File | null; defaultAvatar?: boolean | null } = {};
				data.avatar = file;
				data.defaultAvatar = defaultAvatar;
				onSave(data);
			} else if (e.data.msg.type === 'error') {
				errorToast(e.data.msg.message);
			}
		};
		if (!groupAvatar) {
			const currentGroupAvatar = avatarStore.getGroupAvatar(groupId);
			if (currentGroupAvatar) {
				groupAvatar = currentGroupAvatar;
			} else {
				updateGroupAvatar(group);
			}
		}
		if (groupAvatar) {
			imageToCrop = groupAvatar;
			croppedImage = imageToCrop;
		}
	});

	onDestroy(() => {
		worker?.terminate();
	});

	function dataURLtoBlob(dataURL: string): Blob {
		const parts = dataURL.split(';base64,');
		const contentType = parts[0].split(':')[1];
		const raw = window.atob(parts[1]);
		const rawLength = raw.length;
		const uInt8Array = new Uint8Array(rawLength);
		for (let i = 0; i < rawLength; ++i) {
			uInt8Array[i] = raw.charCodeAt(i);
		}
		return new Blob([uInt8Array], { type: contentType });
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget && !isResizing) {
			onClose();
		}
	}

	function handleSave() {
		if (!croppedImage) return;
		const maxSizeBytes = 2 * 1024 * 1024; // 2MB
		const blob = dataURLtoBlob(croppedImage);
		if (blob.size <= maxSizeBytes) {
			const file = new File([blob], 'cropped-avatar.png', { type: 'image/png' });
			const data: { avatar?: File | null; defaultAvatar?: boolean | null } = {};
			data.avatar = file;
			data.defaultAvatar = defaultAvatar;
			onSave(data);
		} else {
			isResizing = true;
			worker.postMessage({
				msg: {
					type: 'resize',
					imageDataUrl: croppedImage,
					maxSizeBytes: maxSizeBytes
				}
			});
		}
	}

	function handleBackToDefault() {
		const accessToken = get(accessTokenValue);
		if (accessToken) {
			handleGetGroupAvatar(accessToken, groupId, true).then((response) => {
				if (response.success) {
					if (response.avatar) {
						imageToCrop = response.avatar;
						croppedImage = response.avatar;
						defaultAvatar = true;
						resetDefault = true;
					}
				} else {
					errorToast('Failed to fetch group avatar');
				}
			});
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
	}

	function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			if (file.type.startsWith('image/')) {
				filename = file.name;
				const reader = new FileReader();
				reader.onload = (e) => {
					imageToCrop = e.target?.result as string;
					croppedImage = null;
				};
				reader.readAsDataURL(file);
			}
		}
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			const file = event.dataTransfer.files[0];
			if (file.type.startsWith('image/')) {
				filename = file.name;
				const reader = new FileReader();
				reader.onload = async (e) => {
					imageToCrop = e.target?.result as string;
					croppedImage = null;
				};
				reader.readAsDataURL(file);
			}
		}
	}
	function onCropComplete(e: {
		percent: any;
		pixels: { x: number; y: number; width: number; height: number };
	}) {
		latestCropPixels = e.pixels;
		debouncePreview();
	}

	function debouncePreview() {
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(generatePreview, 300);
	}

	async function generatePreview() {
		if (!latestCropPixels || !imageToCrop) return;
		const image = new Image();
		image.src = imageToCrop;
		await new Promise((resolve) => {
			image.onload = resolve;
		});
		const canvas = document.createElement('canvas');
		canvas.width = latestCropPixels.width;
		canvas.height = latestCropPixels.height;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(
			image,
			latestCropPixels.x,
			latestCropPixels.y,
			latestCropPixels.width,
			latestCropPixels.height,
			0,
			0,
			latestCropPixels.width,
			latestCropPixels.height
		);
		croppedImage = canvas.toDataURL('image/png');
		if (!resetDefault) {
			defaultAvatar = false;
		} else {
			resetDefault = true;
		}
	}

	function handleMouseUp() {
		debouncePreview();
	}

	function handleWheel() {
		debouncePreview();
	}
	let fileInput: HTMLInputElement;
	let filename = '';
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
		<div class="modal-header" style="background-color: {groupColor}; color: {textColor};">
			<h2>Edit Group Avatar</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="avatar-section">
			<div class="avatar-edit-container">
				<div
					class="crop-section"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					tabindex="0"
					role="dialog"
					aria-modal="true"
				>
					<p class="avatar-label">Crop Group Avatar</p>
					<div
						class="cropper-container"
						on:mouseup={handleMouseUp}
						on:wheel={handleWheel}
						tabindex="0"
						role="dialog"
						aria-modal="true"
					>
						<Cropper image={imageToCrop} aspect={1} zoom={1} oncropcomplete={onCropComplete} />
					</div>
				</div>
				<div
					class="cropped-preview-section"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					tabindex="0"
					role="dialog"
					aria-modal="true"
				>
					<p class="avatar-label">Cropped Preview</p>
					{#if croppedImage}
						<img src={croppedImage} alt="Cropped Avatar" class="avatar-box" />
					{:else}
						<div class="avatar-box empty-preview">
							<span>Preview will appear here</span>
						</div>
					{/if}
				</div>
				<div
					class="avatar-upload"
					on:dragover={handleDragOver}
					on:drop={handleDrop}
					on:dragenter={() => (isDragging = true)}
					on:dragleave={() => (isDragging = false)}
					class:dragging={isDragging}
					role="region"
					aria-label="Group avatar upload area"
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
		<div class="modal-actions">
			<button on:click={handleSave} disabled={isResizing}>Save</button>
			<button on:click={onClose} disabled={isResizing}>Cancel</button>
			{#if !defaultAvatar}
				<button on:click={handleBackToDefault} disabled={isResizing}>Reset to default</button>
			{/if}
		</div>
	</div>

	{#if isResizing}
		<div
			class="spinner-overlay"
			role="alertdialog"
			aria-label="Image resizing in progress"
			aria-busy="true"
			aria-live="assertive"
		>
			<div class="spinner-container">
				<div class="spinner" role="status"></div>
				<p>Image too large.</p>
				<p>Resizing image, please wait...</p>
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
		padding: 0;
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		width: 90%;
		max-width: 400px;
		text-align: center;
		position: relative;
		z-index: 1;
		overflow: hidden;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 12px 12px 0 0;
		margin: 0;
	}

	.modal-header h2 {
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

	.avatar-section {
		position: relative;
		display: flex;
		justify-content: center;
		margin: 1rem auto;
		padding: 1rem;
	}

	.avatar-edit-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.avatar-box {
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: #3498db;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: calc(30vh * 0.4);
		border-radius: 4px;
	}

	.avatar-upload {
		margin-top: 0.5rem;
		display: flex;
		gap: 0.5rem;
		align-items: center;
		border: 2px dashed transparent;
		padding: 0.5rem;
		border-radius: 4px;
		transition: all 0.2s;
	}
	.avatar-upload.dragging {
		border-color: #3498db;
		background: rgba(52, 152, 219, 0.1);
	}

	.filename-input {
		flex-grow: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		text-align: left;
		background: white;
	}

	.browse-button {
		background: #3498db;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}

	.browse-button:hover {
		background: #2980b9;
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
		margin-bottom: 1.5rem;
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

	.modal-actions button:hover:not(:disabled) {
		background: #2980b9;
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

	.cropper-container {
		width: 30vh;
		height: 30vh;
		max-width: 300px;
		max-height: 300px;
		position: relative;
		margin-bottom: 1rem;
	}

	.crop-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.cropped-preview-section {
		width: 30vh;
		height: 30vh;
		max-width: 300px;
		max-height: 300px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.crop-section,
	.cropped-preview-section {
		border: 2px dashed transparent;
		transition: border-color 0.2s;
	}

	.cropped-preview-section .avatar-label {
		margin: 0;
		font-size: 0.8rem;
		color: #27ae60;
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
		/* Prevent all interaction with elements behind the overlay */
		pointer-events: auto;
	}

	.spinner-container {
		text-align: center;
		color: white;
		background: rgba(0, 0, 0, 0.8);
		padding: 2rem;
		border-radius: 8px;
	}

	.spinner {
		border: 4px solid rgba(255, 255, 255, 0.3);
		border-radius: 50%;
		border-top: 4px solid #3498db;
		width: 50px;
		height: 50px;
		animation: spin 1s linear infinite;
		margin: 0 auto 1rem;
	}
	.cropped-preview-section .avatar-box.empty-preview {
		background: #f0f0f0;
		color: #7f8c8d;
		font-size: 0.9rem;
		border: 1px dashed #bdc3c7;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.empty-preview {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		color: #7f8c8d;
		font-size: 0.9rem;
		border: 1px dashed #bdc3c7;
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
