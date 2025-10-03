<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    goto('/');
  };

  onMount(async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      goto('/');
      return;
    }
    try {
      const TOKEN_URL = "http://localhost:5000/api/v1.0/login/token";
      const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      if (!response.ok) {
        // Token is invalid or expired
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        goto('/');
        return;
      }
      // Token is valid; optionally update the tokens if the endpoint returns new ones
      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
      }
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }
    } catch (err) {
      console.error('Token validation failed:', err);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
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
  <!-- Your game content will go here -->
</main>
