<script>
  import { writable } from 'svelte/store';

  export let emailRegister;
  export let usernameRegister;
  export let passwordRegister;
  export let errorRegister = writable('');
  export let successRegister = writable('');
  export let handleRegister;

  // Create writable stores for the input values
  const localEmailRegister = writable('');
  const localUsernameRegister = writable('');
  const localPasswordRegister = writable('');

  // Subscribe to the stores to update the local values
  $: $localEmailRegister = $emailRegister;
  $: $localUsernameRegister = $usernameRegister;
  $: $localPasswordRegister = $passwordRegister;

  // Update the stores when the local values change
  $: emailRegister.set($localEmailRegister);
  $: usernameRegister.set($localUsernameRegister);
  $: passwordRegister.set($localPasswordRegister);
</script>

<div class="register-box">
  <h2>Register</h2>
  <input type="email" placeholder="Email" bind:value={$localEmailRegister} />
  <input type="text" placeholder="Username" bind:value={$localUsernameRegister} />
  <input type="password" placeholder="Password" bind:value={$localPasswordRegister} />
  <button on:click={handleRegister}>Register</button>
  {#if $errorRegister}
    <p class="error">{$errorRegister}</p>
  {/if}
  {#if $successRegister}
    <p class="success">{$successRegister}</p>
  {/if}
</div>

<style>
  .register-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .register-box h2 {
    margin-bottom: 20px;
    color: #5a3e2a;
    font-family: 'Times New Roman', Times, serif;
  }

  .register-box input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #d4b18c;
    border-radius: 5px;
    background-color: #f5e7c1;
    color: #5a3e2a;
    font-family: 'Times New Roman', Times, serif;
  }

  .register-box button {
    width: 100%;
    padding: 10px;
    background-color: #d4b18c;
    color: #5a3e2a;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: 'Times New Roman', Times, serif;
  }

  .register-box button:hover {
    background-color: #b39a7d;
  }

  .error {
    color: #a83232;
    margin-top: 10px;
    font-family: 'Times New Roman', Times, serif;
  }

  .success {
    color: #3a7d3a;
    margin-top: 10px;
    font-family: 'Times New Roman', Times, serif;
  }
</style>
