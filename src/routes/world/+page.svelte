<script lang="ts">
  import { auth } from "../../stores/auth";
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    const unsubscribe = auth.subscribe((state) => {
      if (!state.isAuthenticated && !state.loading) {
        goto('/');
      }
    });
    return () => unsubscribe();
  });
  
</script>

{#if $auth.isAuthenticated}
  <h1>Page 1 (Protected)</h1>
  <p>Welcome! You are authenticated.</p>
  <button on:click={() => auth.logout()}>
    Logout
  </button>
{:else if !$auth.loading}
  <p>Connecting...</p>
{/if}
