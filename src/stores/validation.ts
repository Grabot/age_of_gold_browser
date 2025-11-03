// import { writable } from 'svelte/store';

// const STORAGE_KEY = 'shouldValidateFlag';

// const storedValue = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : 'true';
// const initialValue = storedValue ? JSON.parse(storedValue) : true;

// export const shouldValidate = writable(initialValue);


// shouldValidate.subscribe((value) => {
// 	if (typeof window !== 'undefined') {
// 		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
// 	}
// });
