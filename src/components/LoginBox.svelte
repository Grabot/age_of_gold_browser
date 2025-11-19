<script>
  import { writable } from 'svelte/store';
  import OAuthButtons from './OAuthButtons.svelte';

  export let usernameOrEmailLogin;
  export let passwordLogin;
  export let handleLogin;

  const localUsernameOrEmailLogin = writable('');
  const localPasswordLogin = writable('');

  $: $localUsernameOrEmailLogin = $usernameOrEmailLogin;
  $: $localPasswordLogin = $passwordLogin;

  $: usernameOrEmailLogin.set($localUsernameOrEmailLogin);
  $: passwordLogin.set($localPasswordLogin);
</script>

<div class="login-box">
  <h2>Login</h2>
  <input type="text" placeholder="Username or Email" bind:value={$localUsernameOrEmailLogin} />
  <input type="password" placeholder="Password" bind:value={$localPasswordLogin} />
  <button on:click={handleLogin}>Login</button>
  <OAuthButtons />
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
</style>