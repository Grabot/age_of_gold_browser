<script>
  import { writable } from 'svelte/store';

  export let usernameLogin;
  export let passwordLogin;
  export let errorLogin;
  export let successLogin;
  export let handleLogin;

  const localUsernameLogin = writable('');
  const localPasswordLogin = writable('');

  $: $localUsernameLogin = $usernameLogin;
  $: $localPasswordLogin = $passwordLogin;

  $: usernameLogin.set($localUsernameLogin);
  $: passwordLogin.set($localPasswordLogin);
</script>

<div class="login-box">
  <h2>Login</h2>
  <input type="text" placeholder="Username or Email" bind:value={$localUsernameLogin} />
  <input type="password" placeholder="Password" bind:value={$localPasswordLogin} />
  <button on:click={handleLogin}>Login</button>
  {#if $errorLogin}
    <p class="error">{$errorLogin}</p>
  {/if}
  {#if $successLogin}
    <p class="success">{$successLogin}</p>
  {/if}
</div>

<style>
  .login-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .login-box h2 {
    margin-bottom: 20px;
    color: #5a3e2a;
  }

  .login-box input {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #d4b18c;
    border-radius: 5px;
    background-color: #f5e7c1;
    color: #5a3e2a;
  }

  .login-box button {
    width: 100%;
    padding: 10px;
    background-color: #d4b18c;
    color: #5a3e2a;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }

  .login-box button:hover {
    background-color: #b39a7d;
  }

  .error {
    color: #a83232;
    margin-top: 10px;
  }

  .success {
    color: #3a7d3a;
    margin-top: 10px;
  }
</style>