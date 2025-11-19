<script lang="ts">
  	import { SvelteToast } from '@zerodevx/svelte-toast'
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { authStore, shouldValidate } from '../stores/authStore';
	
	onMount(() => {
    console.log("mount layout");
		if (get(shouldValidate)) {
			authStore.validateToken();
		} else {
			authStore.authorized();
		}
	});

	let { children } = $props();
	const options = {
		
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<SvelteToast {options} />
