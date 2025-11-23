<script lang="ts">
	import { toast } from '@zerodevx/svelte-toast';
  import LoginBox from '../components/LoginBox.svelte';
  import RegisterBox from '../components/RegisterBox.svelte';
  import UserBox from '../components/UserBox.svelte';
  import { authStore } from '../stores/authStore';
  import { writable } from 'svelte/store';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';

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

  let isMobile = false;

  onMount(() => {
    if (browser) {
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
    }
  });

  function checkIfMobile() {
    isMobile = window.innerWidth <= 768;
  }
</script>


<div class="fullscreen-image-container">
  <img src="/gradient.png" alt="Fullscreen" class="fullscreen-image">

  {#if isMobile}
    <!-- Mobile layout: logo on top, login box below, both centered -->
    <div class="mobile-container">
      <img src="/age_of_gold_promo.png" alt="promo" class="mobile-promo-image">
      <div class="overlay-box mobile-overlay">
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
    </div>
    {:else}
      <!-- Desktop layout: logo on left, login box on right -->
      <img src="/age_of_gold_promo.png" alt="promo" class="promo-image">
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
  {/if}
</div>

<div class="content-below-image">
  <div style="width: 100px; height: 200px; background-color: red;"></div>
</div>

<style>
  @import './+styles.css';
  .mobile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    padding: 20px;
    box-sizing: border-box;
  }

  .mobile-promo-image {
    width: 80%;
    max-width: 300px;
    margin-bottom: 30px;
    z-index: 10;
  }

  .mobile-overlay {
    width: 90%;
    max-width: 400px;
    position: relative;
    transform: none;
    top: auto;
    right: auto;
    margin-bottom: 20px;
  }


  /* Media query for mobile devices */
  @media (max-width: 768px) {
    .promo-image {
      display: none; /* Hide the desktop logo on mobile */
    }

    .overlay-box:not(.mobile-overlay) {
      display: none; /* Hide the desktop overlay on mobile */
    }
  }
</style>