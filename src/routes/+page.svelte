<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(async () => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      goto("/world");
      return;
    }
  });

  let showSignupModal = false;
  let showLoginModal = false;
  let useEmailForLogin = false;
  let showOverlay = false; // New state for overlay visibility

  function openSignup() { showSignupModal = true; }
  function closeSignup() { showSignupModal = false; }
  function openLogin() { showLoginModal = true; }
  function closeLogin() { showLoginModal = false; }
  function toggleLoginInput() { useEmailForLogin = !useEmailForLogin; }
  function toggleOverlay() { showOverlay = !showOverlay; } // Toggle overlay

  // Rest of your script remains the same
  const BACKEND_URL_LOGIN = "http://localhost:5000/api/v1.0/login";
  let usernameLogin = '';
  let emailLogin = '';
  let passwordLogin = '';
  let errorLogin = '';
  let successLogin = '';

  async function handleLogin() {
    if (!passwordLogin) {
      errorLogin = 'Please fill in all fields.';
      return;
    }
    if (useEmailForLogin) {
      if (!emailLogin) {
        errorLogin = 'Please fill in all fields';
        return;
      }
    } else {
      if (!usernameLogin) {
        errorLogin = 'Please fill in all fields';
        return;
      }
    }
    errorLogin = '';
    try {
      if (useEmailForLogin) {
        usernameLogin = "";
      } else {
        emailLogin = "";
      }
      const response = await fetch(BACKEND_URL_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ email: emailLogin, username: usernameLogin, password: passwordLogin })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
      }
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      successLogin = data.message || 'Account created successfully! Redirecting...';
      setTimeout(() => { window.location.href = '/world'; }, 1500);
    } catch (err) {
      errorLogin = err.message || 'An error occurred during login.';
    }
  }

  const BACKEND_URL_REGISTER = "http://localhost:5000/api/v1.0/register";
  let emailRegister = '';
  let usernameRegister = '';
  let passwordRegister = '';
  let errorRegister = '';
  let successRegister = '';

  async function handleRegister() {
    errorRegister = '';
    successRegister = '';
    if (!emailRegister || !usernameRegister || !passwordRegister) {
      errorRegister = 'Please fill in all fields.';
      return;
    }
    try {
      const response = await fetch(BACKEND_URL_REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({ email: emailRegister, username: usernameRegister, password: passwordRegister })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
      }
      const data = await response.json();
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      successRegister = data.message || 'Account created successfully! Redirecting...';
      window.location.href = '/world';
    } catch (err) {
      errorRegister = err.message || 'An error occurred during registration.';
    }
  }
</script>

<header class="top-bar">
  <div class="logo">🎮 Logo</div>
  <nav class="nav-options">
    <a>Home</a>
    <a>Features</a>
    <a>About</a>
  </nav>
  <button class="play-now-top" on:click={toggleOverlay}>Play Now</button>
</header>

<div class="gameplay-container">
  <img
    src="https://upload.wikimedia.org/wikipedia/commons/f/f3/%22Winter_Weather_Bomb%22_develops_along_the_East_Coast_of_the_U_S_%28CIRA_2018-01-03%29.gif?20250505035503"
    alt="Gameplay GIF"
    class="gameplay-gif"
  />
  <div class="play-now-button" on:click={toggleOverlay}>Play Now</div>
  {#if showOverlay}
    <div class="welcome-text-overlay">
      <h1>Welcome to Our Game!</h1>
      <p>Join the adventure and start playing today. Create your account to unlock all features and save your progress.</p>
      <div class="cta-section">
        <h2>Ready to play?</h2>
        <button class="signup-button" on:click={openSignup}>Create an Account</button>
        <p class="login-prompt">Already have an account? <a on:click|preventDefault={openLogin}>Log in here</a>.</p>
      </div>
    </div>
  {/if}
</div>

<!-- Signup Modal -->
{#if showSignupModal}
  <div class="modal" on:click|self={closeSignup}>
    <div class="modal-content" on:click|stopPropagation>
      <span class="close" on:click={closeSignup}>×</span>
      <div class="modal-header">
        <h2>Sign Up</h2>
      </div>
      <div class="modal-body">
        <input type="text" placeholder="Username" bind:value={usernameRegister} required />
        <input type="email" placeholder="Email" bind:value={emailRegister} required />
        <input type="password" placeholder="Password" bind:value={passwordRegister} required />
        {#if errorRegister}
          <p class="error-message">{errorRegister}</p>
        {/if}
        {#if successRegister}
          <p class="success-message">{successRegister}</p>
        {/if}
        <button on:click={handleRegister}>Sign Up</button>
      </div>
    </div>
  </div>
{/if}

<!-- Login Modal -->
{#if showLoginModal}
  <div class="modal" on:click|self={closeLogin}>
    <div class="modal-content" on:click|stopPropagation>
      <span class="close" on:click={closeLogin}>×</span>
      <div class="modal-header">
        <h2>Log In</h2>
      </div>
      <div class="modal-body">
        <div class="input-group">
          {#if useEmailForLogin}
            <input type="email" placeholder="Email" bind:value={emailLogin} required />
          {:else}
            <input type="text" placeholder="Username" bind:value={usernameLogin} required />
          {/if}
          <button class="toggle-input" on:click|preventDefault={toggleLoginInput}>
            {useEmailForLogin ? '👤 Use Username' : '✉️ Use Email'}
          </button>
        </div>
        <input type="password" placeholder="Password" bind:value={passwordLogin} required />
        {#if errorLogin}
          <p class="error-message">{errorLogin}</p>
        {/if}
        {#if successLogin}
          <p class="success-message">{successLogin}</p>
        {/if}
        <button class="login-button" on:click={handleLogin}>Login</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: #333;
    color: white;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 100;
  }
  .logo {
    font-size: 1.5rem;
    font-weight: bold;
  }
  .nav-options a {
    color: white;
    margin: 0 1rem;
    text-decoration: none;
  }
  .play-now-top {
    padding: 0.5rem 1rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  .gameplay-gif {
    text-align: center;
    margin: 2rem 0;
  }
  .gameplay-gif img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  .welcome-page {
    max-width: 600px;
    margin: 4rem auto;
    padding: 2rem;
    text-align: center;
    font-family: Arial, sans-serif;
  }
  h1 {
    color: #333;
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }
  p {
    color: #666;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }
  .cta-section {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .signup-button {
    display: inline-block;
    padding: 0.8rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
  }
  .signup-button:hover {
    background: #45a049;
  }
  .login-prompt {
    margin-top: 1rem;
    font-size: 0.9rem;
  }
  .login-prompt a {
    color: #4CAF50;
    text-decoration: none;
    cursor: pointer;
  }
  .login-prompt a:hover {
    text-decoration: underline;
  }
  .play-now-bottom {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem 2rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1.2rem;
    cursor: pointer;
    z-index: 100;
  }
  /* Modal Styles remain the same as in your code */
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1000;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    position: relative;
  }
  .modal-header {
    margin-bottom: 1.5rem;
  }
  .modal-header h2 {
    margin: 0;
    color: #333;
  }
  .modal-body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .modal-body input {
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  .modal-body button {
    padding: 0.8rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
  }
  .modal-body button:hover {
    background: #45a049;
  }
  .close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    font-size: 1.5rem;
    cursor: pointer;
    color: #666;
  }
  
  .gameplay-container {
    position: relative;
    text-align: center;
    margin: 2rem auto;
    max-width: 90%;
  }

  .gameplay-gif {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    display: block;
    margin: 0 auto; /* This centers the image horizontally */
  }

  .welcome-text-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    text-align: center;
    z-index: 10;
    width: 80%;
    max-width: 600px;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
  }

  .welcome-text-overlay h1 {
    color: white;
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  .welcome-text-overlay p {
    color: white;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 2rem;
  }

  .cta-section {
    background: rgba(245, 245, 245, 0.9);
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    color: #333;
  }
  .play-now-button {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 12px 24px;
    font-size: 1.5em;
    font-weight: bold;
    border: 2px solid #4a9eff;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    z-index: 10;
  }

  .play-now-button:hover {
    background: #4a9eff;
    box-shadow: 0 0 10px #4a9eff;
  }
</style>