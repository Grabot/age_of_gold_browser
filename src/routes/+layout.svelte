<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { shouldValidate } from '../stores/validation';
	import { auth } from '../stores/auth';
	import { get } from 'svelte/store';
	
	onMount(() => {
		if (get(shouldValidate)) {
			console.log("run validation");
			auth.validateToken();
		} else {
			auth.authorized();
			console.log("skip validation");
		}
	});
	
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
