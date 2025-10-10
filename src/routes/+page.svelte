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
  let useEmailForLogin = false;
  
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

<div class="fullscreen-image-container">
  <img src="/gradient.png" alt="Fullscreen" class="fullscreen-image">
  <div class="overlay-box"></div>
</div>


<div class="content-below-image">
  <div style="width: 100px; height: 200px; background-color: red;"></div>
</div>

<style>
  .fullscreen-image-container {
    width: 100%;
    height: 100vh;
    overflow: hidden;
  }
  .fullscreen-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .overlay-box {
    position: absolute;
    width: 100px;
    height: 200px;
    background-color: red;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .content-below-image {
    padding: 2rem;
    background: white;
  }
</style>
