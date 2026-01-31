<script lang="ts">
	import { userDetail } from '$lib/stores/authStore';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';

	export let onSave: (data: { colour: string }) => void;
	export let onClose: () => void;
	export let initialColour: string = get(userDetail).colour;

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let slider: HTMLDivElement;
	let lightnessSlider: HTMLDivElement;
	let lightnessHandle: HTMLDivElement;
	let hexInput: HTMLInputElement;
	let modalContent: HTMLDivElement;

	let canvasSize = 300;
	let centerX: number;
	let centerY: number;
	let outerRadius: number;
	let innerRadius: number;
	let sliderRadius: number;

	let currentAngle = 0;
	let currentLightness = 50;
	let currentColour = initialColour;
	let isDragging = false;
	let isDraggingLightness = false;
	let isUpdatingFromInput = false;

	function updateCanvasSize() {
		if (!modalContent) return;
		
		const modalWidth = modalContent.offsetWidth;
		canvasSize = Math.floor(modalWidth * 0.7);
		
		if (canvas) {
			canvas.width = canvasSize;
			canvas.height = canvasSize;
			canvas.style.width = canvasSize + 'px';
			canvas.style.height = canvasSize + 'px';
		}

		centerX = canvasSize / 2;
		centerY = canvasSize / 2;
		outerRadius = canvasSize * 0.45;
		innerRadius = canvasSize * 0.3;
		sliderRadius = (outerRadius + innerRadius) / 2;

		if (lightnessSlider) {
			const sliderWidth = canvasSize * 0.5;
			lightnessSlider.style.width = sliderWidth + 'px';
			lightnessSlider.style.height = canvasSize * 0.05 + 'px';
		}

		drawColourWheel();
		updateSliderPosition(currentAngle);
		updateLightnessSlider(currentLightness);
	}

	function drawColourWheel() {
		if (!canvas || !ctx) return;

		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const data = imageData.data;

		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x < canvas.width; x++) {
				const dx = x - centerX;
				const dy = y - centerY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				if (distance >= innerRadius && distance <= outerRadius) {
					let angle = Math.atan2(dy, dx);
					if (angle < 0) angle += 2 * Math.PI;
					const hue = (angle / (2 * Math.PI)) * 360;

					const rgb = hslToRgb(hue, 100, 50);

					const index = (y * canvas.width + x) * 4;
					data[index] = rgb.r;
					data[index + 1] = rgb.g;
					data[index + 2] = rgb.b;
					data[index + 3] = 255;
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}

	function hslToRgb(h: number, s: number, l: number) {
		s /= 100;
		l /= 100;

		const c = (1 - Math.abs(2 * l - 1)) * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = l - c / 2;
		let r = 0,
			g = 0,
			b = 0;

		if (0 <= h && h < 60) {
			r = c;
			g = x;
			b = 0;
		} else if (60 <= h && h < 120) {
			r = x;
			g = c;
			b = 0;
		} else if (120 <= h && h < 180) {
			r = 0;
			g = c;
			b = x;
		} else if (180 <= h && h < 240) {
			r = 0;
			g = x;
			b = c;
		} else if (240 <= h && h < 300) {
			r = x;
			g = 0;
			b = c;
		} else if (300 <= h && h < 360) {
			r = c;
			g = 0;
			b = x;
		}

		return {
			r: Math.round((r + m) * 255),
			g: Math.round((g + m) * 255),
			b: Math.round((b + m) * 255)
		};
	}

	function updateSliderPosition(angle: number) {
		if (!slider) return;

		currentAngle = angle;
		const x = centerX + sliderRadius * Math.cos(angle);
		const y = centerY + sliderRadius * Math.sin(angle);

		slider.style.left = x + 'px';
		slider.style.top = y + 'px';

		updateLightnessSliderGradient();
		updateColourDisplay();
	}

	function updateLightnessSlider(lightness: number) {
		if (!lightnessHandle || !lightnessSlider) return;

		currentLightness = Math.max(0, Math.min(100, lightness));

		const rect = lightnessSlider.getBoundingClientRect();
		const x = (currentLightness / 100) * rect.width;
		lightnessHandle.style.left = x + 'px';

		updateColourDisplay();
	}


	function updateLightnessSliderGradient() {
		if (!lightnessSlider) return;
		let angle = Math.round(((currentAngle + Math.PI) / (2 * Math.PI)) * 360)
		angle += 180;
		const hue = angle % 360;
		// const hue = Math.round(((currentAngle + Math.PI) / (2 * Math.PI)) * 360) % 360;
		lightnessSlider.style.background = `linear-gradient(to right, 
            hsl(${hue}, 100%, 0%), 
            hsl(${hue}, 100%, 50%), 
            hsl(${hue}, 100%, 100%))`;
	}

	function hslToHex(h: number, s: number, l: number): string {
		const rgb = hslToRgb(h, s, l);
		const rHex = rgb.r.toString(16).padStart(2, '0');
		const gHex = rgb.g.toString(16).padStart(2, '0');
		const bHex = rgb.b.toString(16).padStart(2, '0');
		return `#${rHex}${gHex}${bHex}`;
	}

	function hexToHsl(hex: string) {
		hex = hex.replace('#', '');

		const r = parseInt(hex.substring(0, 2), 16) / 255;
		const g = parseInt(hex.substring(2, 4), 16) / 255;
		const b = parseInt(hex.substring(4, 6), 16) / 255;

		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		let h = 0,
			s = 0,
			l = (max + min) / 2;

		if (max !== min) {
			const d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

			switch (max) {
				case r:
					h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
					break;
				case g:
					h = ((b - r) / d + 2) / 6;
					break;
				case b:
					h = ((r - g) / d + 4) / 6;
					break;
			}
		}

		return {
			h: h * 360,
			s: s * 100,
			l: l * 100
		};
	}

	function updateFromHex(hexColour: string): boolean {
		const hexRegex = /^#?([0-9A-Fa-f]{6})$/;
		if (!hexRegex.test(hexColour)) {
			return false;
		}

		const hsl = hexToHsl(hexColour);
		const angle = (hsl.h / 360) * 2 * Math.PI;

		isUpdatingFromInput = true;
		updateSliderPosition(angle);
		updateLightnessSlider(hsl.l);
		isUpdatingFromInput = false;

		return true;
	}

	function updateColourDisplay() {
		let angle = Math.round(((currentAngle + Math.PI) / (2 * Math.PI)) * 360)
		angle += 180;
		const hue = angle % 360;
		const colour = `hsl(${hue}, 100%, ${currentLightness}%)`;
		const hexColour = hslToHex(hue, 100, currentLightness);

		currentColour = hexColour;

		if (slider) slider.style.background = colour;
		if (lightnessHandle) lightnessHandle.style.background = colour;

		if (!isUpdatingFromInput && document.activeElement !== hexInput) {
			if (hexInput) hexInput.value = hexColour;
		}
	}

	function getAngleFromPosition(clientX: number, clientY: number): number {
		if (!canvas) return 0;

		const rect = canvas.getBoundingClientRect();
		const x = clientX - rect.left - centerX;
		const y = clientY - rect.top - centerY;
		return Math.atan2(y, x);
	}

	function handleStart(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        isDragging = true;
        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        const angle = getAngleFromPosition(clientX, clientY);
        updateSliderPosition(angle);
    }

    function handleMove(e: MouseEvent | TouchEvent) {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        const clientY = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
        const angle = getAngleFromPosition(clientX, clientY);
        updateSliderPosition(angle);
    }

    function handleEnd() {
        isDragging = false;
    }

    function handleLightnessStart(e: MouseEvent | TouchEvent) {
        e.preventDefault();
        e.stopPropagation(); // Prevent hue circle from receiving this event
        isDraggingLightness = true;
        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        updateLightnessFromPosition(clientX);
    }

    function handleLightnessMove(e: MouseEvent | TouchEvent) {
        if (!isDraggingLightness) return;
        e.preventDefault();
        const clientX = e instanceof MouseEvent ? e.clientX : e.touches[0].clientX;
        updateLightnessFromPosition(clientX);
    }

    function handleLightnessEnd() {
        isDraggingLightness = false;
    }

    function updateLightnessFromPosition(clientX: number) {
        if (!lightnessSlider || !lightnessHandle) return;
        const rect = lightnessSlider.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const lightness = (x / rect.width) * 100;
        updateLightnessSlider(lightness);
    }


	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleSave() {
		onSave({ colour: currentColour });
	}

	 onMount(() => {
        ctx = canvas.getContext('2d')!;
        updateFromHex(initialColour);

        // Attach event listeners for both interactions
        document.addEventListener('mousemove', handleMove as any);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove as any, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('mousemove', handleLightnessMove as any);
        document.addEventListener('mouseup', handleLightnessEnd);
        document.addEventListener('touchmove', handleLightnessMove as any, { passive: false });
        document.addEventListener('touchend', handleLightnessEnd);

        setTimeout(() => updateCanvasSize(), 0);

        const resizeObserver = new ResizeObserver(() => {
            updateCanvasSize();
        });
        if (modalContent) {
            resizeObserver.observe(modalContent);
        }

        return () => {
            document.removeEventListener('mousemove', handleMove as any);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove as any);
            document.removeEventListener('touchend', handleEnd);
            document.removeEventListener('mousemove', handleLightnessMove as any);
            document.removeEventListener('mouseup', handleLightnessEnd);
            document.removeEventListener('touchmove', handleLightnessMove as any);
            document.removeEventListener('touchend', handleLightnessEnd);
            resizeObserver.disconnect();
        };
    });
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
	<div class="modal-content" bind:this={modalContent}>
		<div class="modal-header">
			<h2>Choose Colour</h2>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>
		<div class="modal-body-scrollable">
			<div class="colour-picker-container">
				<canvas
					bind:this={canvas}
					on:mousedown={handleStart}
					on:touchstart={handleStart}
				></canvas>
				<div
					class="lightness-slider"
					bind:this={lightnessSlider}
					on:mousedown={handleLightnessStart}
					on:touchstart={handleLightnessStart}
				>
					<div class="lightness-handle" bind:this={lightnessHandle}></div>
				</div>
				<div class="slider" bind:this={slider}></div>
			</div>
			<div class="colour-display">
				<div class="colour-preview" style="background-color: {currentColour}"></div>
				<input
					type="text"
					bind:this={hexInput}
					value={currentColour}
					placeholder="#ff0000"
					maxlength="7"
					class="hex-input"
					on:input={(e) => {
						const value = e.currentTarget.value;
						if (value.length >= 6) {
							updateFromHex(value);
						}
					}}
					on:change={(e) => updateFromHex(e.currentTarget.value)}
					on:keypress={(e) => {
						if (e.key === 'Enter') {
							updateFromHex(e.currentTarget.value);
							hexInput.blur();
						}
					}}
				/>
			</div>
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
		transition: background 0.2s;
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

	.colour-picker-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	canvas {
		display: block;
		cursor: pointer;
	}

	.slider {
		position: absolute;
		width: 24px;
		height: 24px;
		background: white;
		border: 3px solid #333;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		transform: translate(-50%, -50%);
		transition: transform 0.1s ease;
		pointer-events: none;
	}

	.slider:active {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(1.1);
	}

	.lightness-slider {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		cursor: pointer;
	}

	.lightness-handle {
		position: absolute;
		width: 28px;
		height: 28px;
		background: white;
		border: 3px solid #333;
		border-radius: 50%;
		cursor: grab;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		top: 50%;
		transform: translate(-50%, -50%);
		transition: transform 0.1s ease;
	}

	.lightness-handle:active {
		cursor: grabbing;
		transform: translate(-50%, -50%) scale(1.1);
	}

	.colour-display {
		display: flex;
		align-items: center;
		gap: 1rem;
		width: 100%;
		max-width: 300px;
	}

	.colour-preview {
		width: 60px;
		height: 60px;
		border-radius: 8px;
		border: 2px solid #ddd;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.hex-input {
		flex: 1;
		padding: 0.75rem;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 1rem;
		font-family: monospace;
		font-weight: bold;
		text-align: center;
		background: white;
		transition: border-colour 0.2s;
	}

	.hex-input:focus {
		outline: none;
		border-color: var(--primary-colour, #3498db);
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
		transition: background 0.2s;
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
