<script lang="ts">
	import { errorToast } from '$lib/utils/toast';
	import { onMount } from 'svelte';

	export let onSave: (data: {
		imageBlob?: Blob | null;
		imageUrl?: string | null;
		caption?: string | null;
	}) => void;
	export let onClose: () => void;

	let videoStream: MediaStream | null = null;
	let videoElement: HTMLVideoElement | null = null;
	let canvasElement: HTMLCanvasElement | null = null;
	let imageUrl: string | null = null;
	let imageBlob: Blob | null = null;
	let isCapturing = false;
	let facingMode: 'user' | 'environment' = 'user';
	let caption = '';

	onMount(() => {
		startCamera();
	});

	async function startCamera() {
		try {
			const constraints = {
				video: {
					facingMode: facingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			};

			videoStream = await navigator.mediaDevices.getUserMedia(constraints);

			if (videoElement) {
				videoElement.srcObject = videoStream;
				videoElement.play();
			}

			isCapturing = true;
		} catch (error) {
			errorToast('Could not access camera: ' + error);
			console.error('Error accessing camera:', error);
		}
	}

	function stopCamera() {
		if (videoStream) {
			videoStream.getTracks().forEach((track) => track.stop());
			videoStream = null;
		}
		isCapturing = false;
	}

	function captureImage() {
		if (!videoElement || !canvasElement) return;

		// Set canvas dimensions to match video
		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;

		const context = canvasElement.getContext('2d');
		if (context) {
			context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

			// Convert canvas to blob
			canvasElement.toBlob(
				(blob) => {
					if (blob) {
						imageBlob = blob;
						imageUrl = URL.createObjectURL(blob);
					}
				},
				'image/jpeg',
				0.92
			); // 92% quality
		}
	}

	function switchCamera() {
		facingMode = facingMode === 'user' ? 'environment' : 'user';
		stopCamera();
		startCamera();
	}

	function handleSaveImage() {
		if (imageBlob && imageUrl) {
			const data = {
				imageBlob: imageBlob,
				imageUrl: imageUrl,
				caption: caption || null
			};
			onSave(data);
		} else {
			errorToast('No image captured');
		}
	}

	function handleRetry() {
		imageUrl = null;
		imageBlob = null;
		if (videoStream) {
			videoElement?.play();
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	// Cleanup on component destroy
	import { onDestroy } from 'svelte';
	onDestroy(() => {
		stopCamera();
	});
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
	aria-label="Camera View"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Camera</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="camera-section">
			{#if !imageUrl}
				<!-- Camera Preview -->
				<div class="camera-preview">
					<div class="video-container">
						<video bind:this={videoElement} class="video-element" autoplay playsinline muted
						></video>
						<canvas bind:this={canvasElement} style="display: none;"></canvas>
					</div>

					<div class="camera-controls">
						<button class="capture-button" on:click={captureImage} disabled={!isCapturing}>
							📸 Capture
						</button>
						<button class="switch-button" on:click={switchCamera} disabled={!isCapturing}>
							🔄 Switch Camera
						</button>
					</div>

					<div class="upload-section">
						<p class="or-text">or upload an image</p>
						<input
							type="file"
							id="image-upload"
							accept="image/*"
							style="display: none;"
							on:change={(e) => {
								const input = e.target as HTMLInputElement;
								if (input.files && input.files.length > 0) {
									const file = input.files[0];
									if (file.type.startsWith('image/')) {
										const reader = new FileReader();
										reader.onload = (event) => {
											imageUrl = event.target?.result as string;
											imageBlob = file;
										};
										reader.readAsDataURL(file);
									} else {
										errorToast('Please select an image file');
									}
								}
							}}
						/>
						<button
							class="upload-button"
							on:click={() => document.getElementById('image-upload')?.click()}
						>
							📁 Upload Image
						</button>
					</div>
				</div>
			{:else}
				<!-- Image Preview -->
				<div class="image-preview">
					<div class="preview-container">
						<img src={imageUrl} alt="Captured" class="preview-image" />
					</div>

					<div class="caption-section">
						<textarea placeholder="Add a caption..." bind:value={caption} class="caption-input"
						></textarea>
					</div>
					<div class="preview-controls">
						<button class="retry-button" on:click={handleRetry}> 🔄 Retake </button>
						<button class="use-button" on:click={handleSaveImage}> ✅ Use Photo </button>
					</div>
				</div>
			{/if}
		</div>
		<div class="modal-footer">
			<div class="modal-actions">
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

	.camera-section {
		padding: 1rem 1.2rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.camera-preview,
	.image-preview {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.video-container {
		width: 100%;
		aspect-ratio: 4/3;
		background: #000;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.video-element {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transform: scaleX(-1); /* Mirror the video */
	}

	.camera-controls {
		width: 100%;
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.capture-button {
		background: #e74c3c;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.capture-button:hover:not(:disabled) {
		background: #c0392b;
		transform: scale(1.05);
	}

	.capture-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.switch-button {
		background: #3498db;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.switch-button:hover:not(:disabled) {
		background: #2980b9;
		transform: scale(1.05);
	}

	.switch-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.upload-section {
		width: 100%;
		text-align: center;
		margin-top: 1rem;
	}

	.or-text {
		font-size: 0.9rem;
		color: #7f8c8d;
		margin-bottom: 0.5rem;
	}

	.upload-button {
		background: var(--primary-colour);
		color: var(--text-colour-on-primary);
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.upload-button:hover {
		background: var(--primary-colour-dark);
	}

	.preview-container {
		width: 100%;
		aspect-ratio: 4/3;
		background: #f5f5f5;
		border-radius: 8px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.preview-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.caption-section {
		width: 100%;
		margin-top: 1rem;
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

	.preview-controls {
		width: 100%;
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-top: 1rem;
	}

	.retry-button {
		background: #f39c12;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
	}

	.retry-button:hover {
		background: #e67e22;
	}

	.use-button {
		background: #2ecc71;
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		border-radius: 50px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
	}

	.use-button:hover {
		background: #27ae60;
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
</style>
