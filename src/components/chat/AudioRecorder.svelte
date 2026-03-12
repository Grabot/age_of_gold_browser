<script lang="ts">
	import { errorToast } from '$lib/utils/toast';
	import { onMount } from 'svelte';
	import audiobufferToWav from 'audiobuffer-to-wav';

	// Format file size for display
	function formatFileSize(size: number) {
		if (!size) return '0 bytes';

		const units = ['bytes', 'KB', 'MB', 'GB'];
		let unitIndex = 0;
		let formattedSize = size;

		while (formattedSize >= 1024 && unitIndex < units.length - 1) {
			formattedSize /= 1024;
			unitIndex++;
		}

		return `${formattedSize.toFixed(2)} ${units[unitIndex]}`;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragging = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragging = false;
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		isDragging = false;

		if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
			const file = event.dataTransfer.files[0];

			const MAX_SIZE_FOR_PREVIEW = 100 * 1024 * 1024; // 100MB
			isLargeFile = file.size > MAX_SIZE_FOR_PREVIEW;

			if (isLargeFile) {
				filename = file.name;
				selectedFile = file;
				isUploadedFile = true;
				isLoading = false;
				audioUrl = null;
				return;
			}

			if (file.type.startsWith('audio/')) {
				handleFileUpload({ target: { files: [file] } } as unknown as Event);
			} else {
				errorToast('Please drop an audio file');
			}
		}
	}

	export let onSave: (data: {
		audioBlob?: Blob | null;
		audioUrl?: string | null;
		duration: number;
	}) => void;
	export let onClose: () => void;

	let isRecording = false;
	let isPlaying = false;
	let audioUrl: string | null = null;
	let audioBlob: Blob | null = null;
	let isLoading = false;
	let duration = 0;
	let timer: ReturnType<typeof setInterval> | null = null;
	let mediaRecorder: MediaRecorder | null = null;
	let isLargeFile = false;
	let filename = '';
	let selectedFile: File | null = null;
	let audioChunks: Blob[] = [];
	let isDragging = false;
	let isUploadedFile = false;
	let audioContext: AudioContext | null = null;
	let analyser: AnalyserNode | null = null;
	let canvas: HTMLCanvasElement | null = null;
	let canvasCtx: CanvasRenderingContext2D | null = null;
	let animationFrameId: number | null = null;

	onMount(() => {
		try {
			audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		} catch (error) {
			console.error('Audio context not supported:', error);
		}
	});

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];

			mediaRecorder.ondataavailable = (event) => {
				if (event.data.size > 0) {
					audioChunks.push(event.data);
				}
			};

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
				audioUrl = URL.createObjectURL(audioBlob);

				const audio = new Audio(audioUrl);
				audio.onloadedmetadata = () => {
					duration = audio.duration;
				};
			};

			setupAudioVisualization(stream);

			mediaRecorder.start();
			isRecording = true;
			startTimer();
		} catch (error) {
			isLoading = false;
			errorToast('Error loading audio file');
		}
	}

	function stopRecording() {
		if (mediaRecorder && isRecording) {
			mediaRecorder.stop();
			isRecording = false;
			stopTimer();

			mediaRecorder.stream.getTracks().forEach((track) => track.stop());

			if (animationFrameId) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
		}
	}

	function setupAudioVisualization(stream: MediaStream) {
		if (!audioContext) return;

		const source = audioContext.createMediaStreamSource(stream);
		analyser = audioContext.createAnalyser();
		analyser.fftSize = 256;

		source.connect(analyser);

		canvas = document.getElementById('audio-visualizer') as HTMLCanvasElement;
		if (canvas) {
			canvasCtx = canvas.getContext('2d');
			if (canvasCtx) {
				drawVisualizer();
			}
		}
	}

	function drawVisualizer() {
		if (!analyser || !canvasCtx || !canvas) return;

		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		function draw() {
			if (!analyser || !canvasCtx || !canvas) {
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
				}
				return;
			}

			animationFrameId = requestAnimationFrame(draw);

			analyser.getByteFrequencyData(dataArray);

			canvasCtx.fillStyle = 'rgb(255, 255, 255)';
			canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

			const barWidth = (canvas.width / bufferLength) * 2.5;
			let x = 0;

			for (let i = 0; i < bufferLength; i++) {
				const barHeight = dataArray[i] / 2;

				canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ',50,50)';
				canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

				x += barWidth + 1;
			}
		}

		draw();
	}

	function startTimer() {
		duration = 0;
		timer = setInterval(() => {
			duration++;
		}, 1000);
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	async function reencodeToWav(audioBlob: Blob): Promise<Blob> {
		const audioContext = new AudioContext();
		const arrayBuffer = await audioBlob.arrayBuffer();
		const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
		const wavBytes = audiobufferToWav(audioBuffer);
		return new Blob([wavBytes], { type: 'audio/wav' });
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			const file = input.files[0];
			console.log('File type:', file.type, 'File size:', file.size);

			const MAX_SIZE_FOR_PREVIEW = 100 * 1024 * 1024; // 100MB
			isLargeFile = file.size > MAX_SIZE_FOR_PREVIEW;

			if (isLargeFile) {
				filename = file.name;
				selectedFile = file;
				isUploadedFile = true;
				isLoading = false;
				audioUrl = null;
				return;
			}

			if (file.type.startsWith('audio/')) {
				try {
					isLoading = true;
					selectedFile = file;
					const audio = new Audio(URL.createObjectURL(file));
					audio.onloadedmetadata = async () => {
						duration = audio.duration;
						// Re-encode to WAV for better compatibility
						const wavBlob = await reencodeToWav(file);
						audioUrl = URL.createObjectURL(wavBlob);
						audioBlob = wavBlob;
						isUploadedFile = true;
						isLoading = false;
					};
					audio.onerror = async () => {
						errorToast('Could not load audio file. Re-encoding as WAV...');
						try {
							const wavBlob = await reencodeToWav(file);
							audioUrl = URL.createObjectURL(wavBlob);
							audioBlob = wavBlob;
							isUploadedFile = true;
							isLoading = false;
							const audio2 = new Audio(audioUrl);
							audio2.onloadedmetadata = () => {
								duration = audio2.duration;
							};
							audio2.onerror = () => {
								errorToast('Failed to re-encode audio file.');
								audioUrl = null;
								audioBlob = null;
								isLoading = false;
								isUploadedFile = false;
							};
						} catch (e) {
							errorToast('Error re-encoding audio file.');
							audioUrl = null;
							audioBlob = null;
							isUploadedFile = false;
						}
					};
				} catch (e) {
					errorToast('Error processing audio file.');
				}
			} else {
				errorToast('Please select an audio file (MP3 or WAV).');
			}
		}
	}

	function handleSaveRecording() {
		if (isLargeFile && selectedFile) {
			// For large files, create a blob from the selected file
			const data = {
				audioBlob: selectedFile,
				audioUrl: null,
				duration: duration
			};
			onSave(data);
		} else if (!audioBlob && audioChunks.length > 0) {
			audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
		}

		if (audioBlob) {
			const data = {
				audioBlob: audioBlob,
				audioUrl: audioUrl,
				duration: duration
			};
			onSave(data);
		} else {
			errorToast('No audio recorded');
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
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
	aria-label="Audio Recorder"
>
	<div class="modal-content">
		<div class="modal-header">
			<h2>Record Audio</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		{#if isLoading}
			<div class="loading-overlay">
				<div class="loading-spinner"></div>
				<p>Loading audio file...</p>
			</div>
		{/if}
		<div class="audio-section">
		{#if isLargeFile}
				<div class="playback-controls">
					<div class="large-file-notice">
						<p>📁 {filename}</p>
						<p class="file-size">
							File is too large for preview ({selectedFile
								? formatFileSize(selectedFile.size)
								: 'unknown size'})
						</p>
						<p class="file-info">
							The file has been selected but cannot be previewed due to its size.
						</p>
					</div>
					<div class="playback-actions">
						<button
							class="re-record-button"
							on:click={() => {
								audioUrl = null;
								audioBlob = null;
								filename = '';
								selectedFile = null;
								isLargeFile = false;
								duration = 0;
								isUploadedFile = false;
							}}
						>
							🔙 Go Back
						</button>
					</div>
				</div>
			{:else}
				{#if !audioUrl}
					<div
						class="recording-controls"
						on:dragover={handleDragOver}
						on:drop={handleDrop}
						class:dragging={isDragging}
						role="region"
						aria-label="Audio recording area"
					>
						<div class="record-button-container">
							{#if isRecording}
								<button class="record-button stop" on:click={stopRecording}> ■ Stop </button>
							{:else}
								<button class="record-button" on:click={startRecording}> ● Record </button>
							{/if}
						</div>

						<div class="timer">
							{Math.floor(duration / 60)}:{duration % 60 < 10 ? '0' + (duration % 60) : duration % 60}
						</div>

						<div
							class="visualizer-placeholders"
							on:dragover={handleDragOver}
							on:drop={handleDrop}
							class:dragging={isDragging}
							role="region"
							aria-label="Audio drop area"
						>
							{#if isRecording}
								<canvas id="audio-visualizer" width="300" height="100"></canvas>
							{:else}
								<div class="visualizer-placeholder">
									Audio visualization will appear here when recording
								</div>
							{/if}
						</div>

						<div class="or-divider">
							<span>or</span>
						</div>

						<div class="upload-section">
							<input
								type="file"
								on:change={handleFileUpload}
								accept="audio/*"
								class="field-input"
								style="display: none;"
								bind:this={fileInput}
							/>
							<button
								class="upload-button"
								on:click={() => fileInput.click()}
								on:dragover={handleDragOver}
								on:drop={handleDrop}
							>
								Upload Audio File
							</button>
						</div>
					</div>
				{:else}
					<div class="playback-controls">
						<div class="audio-player">
							<audio src={audioUrl} controls class="audio-element"></audio>
						</div>

						<div class="playback-info">
							<p>
								Duration: {Math.floor(duration / 60)}:{duration % 60 < 10
									? '0' + (duration % 60)
									: duration % 60}
							</p>
						</div>

						<div class="playback-actions">
							<button
								class="re-record-button"
								on:click={() => {
									audioUrl = null;
									audioBlob = null;
									duration = 0;
								}}
							>
								{isUploadedFile ? '🔙 Go Back' : '🔄 Re-record'}
							</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
		<div class="modal-footer">
			<div class="modal-actions">
				<button on:click={onClose}>Cancel</button>
				{#if audioUrl || isLargeFile}
					<button on:click={handleSaveRecording}>Send</button>
				{/if}
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

	.audio-section {
		padding: 1rem 1.2rem;
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.recording-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		width: 100%;
	}

	.record-button-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.record-button {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: bold;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease;
	}

	.record-button {
		background: #e74c3c;
	}

	.record-button.stop {
		background: #3498db;
	}

	.record-button:hover {
		transform: scale(1.05);
		box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
	}

	.timer {
		font-size: 2rem;
		font-weight: bold;
		color: #2c3e50;
	}

	.visualizer-placeholders {
		width: 100%;
		max-width: 300px;
		height: 100px;
		background: #f5f5f5;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 1rem 0;
	}

	.visualizer-placeholder {
		color: #7f8c8d;
		font-size: 0.9rem;
		text-align: center;
		padding: 1rem;
	}

	.or-divider {
		width: 100%;
		text-align: center;
		border-bottom: 1px solid #eee;
		line-height: 0.1em;
		margin: 1rem 0;
	}

	.or-divider span {
		background: white;
		padding: 0 10px;
		color: #7f8c8d;
	}

	.dragging {
		border: 2px dashed var(--primary-colour) !important;
		background: rgba(var(--primary-colour-light), 0.1) !important;
	}

	.upload-section {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.upload-button {
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

	.upload-button:hover {
		background: var(--primary-colour-dark);
	}

	.playback-controls {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.audio-player {
		width: 100%;
		max-width: 400px;
	}

	.audio-element {
		width: 100%;
	}

	.playback-info {
		color: #7f8c8d;
		font-size: 0.9rem;
		text-align: center;
	}

	.playback-actions {
		width: 100%;
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.re-record-button {
		background: #f39c12;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.re-record-button:hover {
		background: #e67e22;
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

	.large-file-notice {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 4px;
	}

	.file-size {
		font-size: 0.9rem;
		color: #6c757d;
		margin: 0.5rem 0;
	}

	.file-info {
		font-size: 0.8rem;
		color: #6c757d;
		margin-top: 0.5rem;
	}

	.loading-overlay {
		position: absolute;
		top: 60px;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.8);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid var(--primary-colour);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 10px;
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
