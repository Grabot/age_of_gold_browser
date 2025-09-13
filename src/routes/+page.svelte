<script>
	import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(async () => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // Go to world, maybe it can redirect immediatly!
      goto("/world");
      return;
    }
  });
  let showSignupModal = false;
  let showLoginModal = false;
  let useEmailForLogin = false;

  function openSignup() {
    showSignupModal = true;
  }

  function closeSignup() {
    showSignupModal = false;
  }

  function openLogin() {
    showLoginModal = true;
  }

  function closeLogin() {
    showLoginModal = false;
  }
  
  const BACKEND_URL_LOGIN = "http://localhost:5000/api/v1.0/login";

  let usernameLogin = '';
  let emailLogin = '';
  let passwordLogin = '';
  let errorLogin = '';
  let successLogin = '';

  function toggleLoginInput() {
    useEmailForLogin = !useEmailForLogin;
  }

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailLogin,
          username: usernameLogin,
          password: passwordLogin
        })
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

      setTimeout(() => {
        window.location.href = '/world';
      }, 1500);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailRegister,
          username: usernameRegister,
          password: passwordRegister
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed.');
      }

      const data = await response.json();

      // Store tokens and user data in localStorage
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

<main class="welcome-page">
  <h1>Welcome to Our Game!</h1>
  <p>Join the adventure and start playing today. Create your account to unlock all features and save your progress.</p>
  <div class="cta-section">
    <h2>Ready to play?</h2>
    <button class="signup-button" on:click={openSignup}>Create an Account</button>
    <p class="login-prompt">Already have an account? <a on:click|preventDefault={openLogin}>Log in here</a>.</p>
  </div>
</main>

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
            <input
              type="email"
              placeholder="Email"
              bind:value={emailLogin}
              required
            />
          {:else}
            <input
              type="text"
              placeholder="Username"
              bind:value={usernameLogin}
              required
            />
          {/if}
          <button class="toggle-input" on:click|preventDefault={toggleLoginInput}>
            {useEmailForLogin ? '👤 Use Username' : '✉️ Use Email'}
          </button>
        </div>
        <input
          type="password"
          placeholder="Password"
          bind:value={passwordLogin}
          required
        />
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
  .welcome-page {
    max-width: 600px;
    margin: 0 auto;
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
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    font-size: 1.1rem;
    margin: 0.5rem;
    cursor: pointer;
    transition: background 0.3s;
  }
  .signup-button {
    background: #4CAF50;
    color: white;
    border: none;
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

  /* Modal Styles */
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
</style>
