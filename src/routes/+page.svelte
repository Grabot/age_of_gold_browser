<script lang="ts">
	import { toast } from '@zerodevx/svelte-toast';
  import LoginBox from '../components/LoginBox.svelte';
  import RegisterBox from '../components/RegisterBox.svelte';
  import UserBox from '../components/UserBox.svelte';
  import { authStore } from '../stores/authStore';
  import { writable } from 'svelte/store';

  const usernameOrEmailLogin = writable('');
  const passwordLogin = writable('');

  const emailRegister = writable('');
  const usernameRegister = writable('');
  const passwordRegister = writable('');

  function validateLoginFields(password: string, usernameOrEmail: string) {
    if (!password || !usernameOrEmail) {
      return { success: false, message: 'Please fill in all fields.' };
    }
    return { success: true };
  }
  async function handleLogin() {
    const usernameOrEmailValue = $usernameOrEmailLogin;
    const passwordValue = $passwordLogin;

    const validationResult = validateLoginFields(passwordValue, usernameOrEmailValue);
    if (!validationResult.success) {
      toast.push(validationResult.message || 'An error occurred during validation', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(usernameOrEmailValue);
    const emailValue = isEmail ? usernameOrEmailValue : null;
    const usernameValue = isEmail ? null : usernameOrEmailValue;
    
    const loginResult = await authStore.login(emailValue, usernameValue, passwordValue);
    if (loginResult) {
      window.location.href = '/world';
    }
  }

  function validateRegisterFields(email: string, username: string, password: string) {
    if (!email || !username || !password) {
      return { success: false, message: 'Please fill in all fields.' };
    }
    return { success: true };
  }
  async function handleRegister() {
    const emailValue = $emailRegister;
    const usernameValue = $usernameRegister;
    const passwordValue = $passwordRegister;

    const validationResult = validateRegisterFields(emailValue, usernameValue, passwordValue);
    if (!validationResult.success) {
      toast.push(validationResult.message || 'An error occurred during validation', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
      return;
    }
    const registerResult = await authStore.register(emailValue, usernameValue, passwordValue);
    if (registerResult) {
      setTimeout(() => { window.location.href = '/world'; }, 1500);
    }
  }

  let activeTab = 'login';
</script>

<div class="fullscreen-image-container">
  <img src="/gradient.png" alt="Fullscreen" class="fullscreen-image">
  <div class="overlay-box">
    {#if $authStore.isAuthenticated}
      <UserBox />
    {:else}
      <div class="tab-container">
        <button class="tab-button" on:click={() => activeTab = 'login'} class:active={activeTab === 'login'}>Login</button>
        <button class="tab-button" on:click={() => activeTab = 'register'} class:active={activeTab === 'register'}>Register</button>
      </div>
      {#if activeTab === 'login'}
        <LoginBox
          usernameOrEmailLogin={usernameOrEmailLogin}
          passwordLogin={passwordLogin}
          handleLogin={handleLogin}
        />
        <span>You are not signed in</span>
      {:else}
        <RegisterBox
          emailRegister={emailRegister}
          usernameRegister={usernameRegister}
          passwordRegister={passwordRegister}
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