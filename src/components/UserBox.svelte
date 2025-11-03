<script lang="ts">
  import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { auth, shouldValidate, userDetail } from '../stores/auth';

  
  function handleLogout() {
    auth.logout();
  }

  function goToWorld() {
    goto('/world')
  }
</script>

<div class="logged-in-message">
  <p>Logged in as: {get(userDetail).username}</p>
  <div class="button-container">
    <button class="play-button" on:click={goToWorld}>Play</button>
    <button class="logout-button" on:click={handleLogout}>Logout</button>
  </div>
</div>

<style>
  .logged-in-message {
    padding: 20px;
    text-align: center;
    font-size: 1.2em;
    color: #000; /* Changed text color to black */
  }

  .button-container {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
  }

  .play-button, .logout-button {
    padding: 10px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
  }

  .play-button {
    background-color: #4CAF50;
    color: white;
  }

  .logout-button {
    background-color: #f44336;
    color: white;
  }
</style>