<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) {
      goto('/login');
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
        goto('/login');
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
      goto('/login');
    }
  });
</script>

<!-- Empty page (your game will render here) -->
<main>
  <!-- Your game content will go here -->
</main>
