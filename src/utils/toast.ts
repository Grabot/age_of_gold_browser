import { toast } from '@zerodevx/svelte-toast';

export const errorToast = (message: string) => {
	toast.push(message, {
		theme: {
			'--toastColor': '#000000',
			'--toastBackground': '#EE4B2B',
			'--toastBarBackground': '#4A0404'
		}
	});
};

export const successToast = (message: string) => {
	toast.push(message, {
		theme: {
			'--toastColor': '#000000',
			'--toastBackground': '#4CAF50',
			'--toastBarBackground': '#2E7D32'
		}
	});
};
