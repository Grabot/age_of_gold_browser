interface PostMessage<T> {
	msg: T;
}

interface ResizeRequest {
	type: 'resize';
	imageDataUrl: string;
	maxSizeBytes: number;
}

interface ResizeResponse {
	type: 'resize';
	result: string;
}

interface ErrorResponse {
	type: 'error';
	message: string;
}

onmessage = async ({ data }: MessageEvent<PostMessage<ResizeRequest>>) => {
	if (data.msg.type === 'resize') {
		try {
			const result = await resizeImage(data.msg.imageDataUrl, data.msg.maxSizeBytes);
			postMessage({ msg: { type: 'resize', result } });
		} catch (error) {
			postMessage({
				msg: {
					type: 'error',
					message: `Failed to resize image: ${error instanceof Error ? error.message : String(error)}`
				}
			});
		}
	}
};

async function blobToDataURL(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

async function resizeImage(imageDataUrl: string, maxSizeBytes: number): Promise<string> {
	const base64Data = imageDataUrl.split(',')[1];
	const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
	const blob = new Blob([imageBuffer], { type: 'image/png' });
	const imageBitmap = await createImageBitmap(blob);

	let width = imageBitmap.width;
	let height = imageBitmap.height;
	let quality = 0.92;

	const checkAndResize = async (): Promise<string> => {
		const canvas = new OffscreenCanvas(width, height);
		const ctx = canvas.getContext('2d')!;
		ctx.drawImage(imageBitmap, 0, 0, width, height);

		const resizedBlob = await canvas.convertToBlob({
			type: 'image/png',
			quality: quality < 1 ? quality : undefined // convertToBlob doesn't accept quality for PNG in all browsers
		});

		if (resizedBlob.size > maxSizeBytes && quality > 0.1) {
			quality -= 0.05;
			return checkAndResize();
		} else if (resizedBlob.size > maxSizeBytes && width > 100) {
			width *= 0.9;
			height *= 0.9;
			return checkAndResize();
		} else {
			return await blobToDataURL(resizedBlob);
		}
	};

	return checkAndResize();
}

export {};
