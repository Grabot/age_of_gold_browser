<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { auth, shouldValidate } from '../stores/auth';
	import { get } from 'svelte/store';
	
	onMount(() => {
		if (get(shouldValidate)) {
			auth.validateToken();
		} else {
			auth.authorized();
		}
	});
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
