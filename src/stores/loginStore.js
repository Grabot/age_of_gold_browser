import { writable } from 'svelte/store';

export const emailLogin = writable('');
export const usernameLogin = writable('');
export const passwordLogin = writable('');
export const errorLogin = writable('');
export const successLogin = writable('');
