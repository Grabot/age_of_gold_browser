<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { handleTokenLogin } from '../../utils/tokenUtils';
	import { logoutUser } from '../../services/logoutService';

  const logout = () => {
    logoutUser();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    goto('/');
  };

  onMount(async () => {
    const isLoggedIn = await handleTokenLogin();
    if (!isLoggedIn) {
      goto('/');
    }
  });
</script>

<style>
  .logout-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background-color: #ff3e00;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .logout-button:hover {
    background-color: #e63a00;
  }
</style>

<button class="logout-button" on:click={logout}>
  Logout
</button>

<main>
  <!-- game content -->
</main>
