<script lang="ts">
  import { onMount } from 'svelte';
  import LoginBox from '../components/LoginBox.svelte';
  import RegisterBox from '../components/RegisterBox.svelte';
  import { emailLogin, usernameLogin, passwordLogin, errorLogin, successLogin } from '../stores/loginStore';
  import { emailRegister, usernameRegister, passwordRegister, errorRegister, successRegister } from '../stores/registerStore';
  import { loginUser, validateLoginFields } from '../services/loginService';
  import { registerUser, validateRegisterFields } from '../services/registerService';
	import { auth } from '../stores/auth';
	import UserBox from '../components/UserBox.svelte';

  async function handleLogin() {
    const emailValue = $emailLogin;
    const usernameValue = $usernameLogin;
    const passwordValue = $passwordLogin;

    const validationResult = validateLoginFields(passwordValue, emailValue, usernameValue, false);
    if (!validationResult.success) {
      errorLogin.set(validationResult.message || 'An error occurred during validation');
      return;
    }
    errorLogin.set('');
    try {
      const result = await loginUser(emailValue, usernameValue, passwordValue);
      if (result.success) {
        successLogin.set(result.message);
        setTimeout(() => { window.location.href = '/world'; }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      errorLogin.set((err as Error).message || 'An error occurred during login.');
    }
  }

  async function handleRegister() {
    const emailValue = $emailRegister;
    const usernameValue = $usernameRegister;
    const passwordValue = $passwordRegister;

    const validationResult = validateRegisterFields(emailValue, usernameValue, passwordValue);
    if (!validationResult.success) {
      errorRegister.set(validationResult.message || 'An error occurred during validation');
      return;
    }
    errorRegister.set('');
    try {
      const result = await registerUser(emailValue, usernameValue, passwordValue);
      if (result.success) {
        successRegister.set(result.message);
        setTimeout(() => { window.location.href = '/world'; }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (err) {
      errorRegister.set((err as Error).message || 'An error occurred during registration.');
    }
  }

  function handleLogout() {
    console.log("logging out!");
    // TODO: logout
  }

  let activeTab = 'login';
</script>

<div class="fullscreen-image-container">
  <img src="/gradient.png" alt="Fullscreen" class="fullscreen-image">
  <div class="overlay-box">
    {#if $auth.isAuthenticated}
      <UserBox
        handleLogout={handleLogout}
      />
    {:else}
    test
      <div class="tab-container">
        <button class="tab-button" on:click={() => activeTab = 'login'} class:active={activeTab === 'login'}>Login</button>
        <button class="tab-button" on:click={() => activeTab = 'register'} class:active={activeTab === 'register'}>Register</button>
      </div>
      {#if activeTab === 'login'}
        <LoginBox
          usernameLogin={usernameLogin}
          passwordLogin={passwordLogin}
          errorLogin={errorLogin}
          successLogin={successLogin}
          handleLogin={handleLogin}
        />
      {:else}
        <RegisterBox
          emailRegister={emailRegister}
          usernameRegister={usernameRegister}
          passwordRegister={passwordRegister}
          errorRegister={errorRegister}
          successRegister={successRegister}
          handleRegister={handleRegister}
        />
      {/if}
    {/if}
  </div>
  <img src="/age_of_gold_promo.png" alt="promo" class="promo-image">
</div>
<div class="content-below-image">
  <div style="width: 100px; height: 200px; background-color: red;"></div>
</div>

<style>
  @import './+styles.css';
</style>
