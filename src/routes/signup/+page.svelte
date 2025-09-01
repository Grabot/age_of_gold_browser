<script>
  const BACKEND_URL = "http://localhost:5000/api/v1.0/register";

  let email = '';
  let username = '';
  let password = '';
  let error = '';
  let success = '';

  async function handleSignup() {
    error = '';
    success = '';

    if (!email || !username || !password) {
      error = 'Please fill in all fields.';
      return;
    }

    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, username, password }),
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

      success = data.message || 'Account created successfully! Redirecting...';

      setTimeout(() => {
        window.location.href = '/world';
      }, 1500);
    } catch (err) {
      error = err.message || 'An error occurred during registration.';
    }
  }
</script>


<main class="signup-page">
  <h1>Create an Account</h1>
  <p>Join us and start your adventure!</p>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if success}
    <p class="success">{success}</p>
  {/if}

  <form on:submit|preventDefault={handleSignup}>
    <div class="form-group">
      <label for="email">Email</label>
      <input
        type="email"
        id="email"
        bind:value={email}
        placeholder="Enter your email"
        required
      />
    </div>

    <div class="form-group">
      <label for="username">Username</label>
      <input
        type="text"
        id="username"
        bind:value={username}
        placeholder="Choose a username"
        required
      />
    </div>

    <div class="form-group">
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="Create a password"
        required
      />
    </div>

    <button type="submit" class="signup-button">Sign Up</button>
  </form>

  <p class="login-prompt">
    Already have an account? <a href="/login">Log in here</a>.
  </p>
</main>

<style>
  /* Styles remain the same as before */
  .signup-page {
    max-width: 400px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
    font-family: Arial, sans-serif;
  }

  h1 {
    color: #333;
    font-size: 2rem;
    margin-bottom: 1rem;
  }

  p {
    color: #666;
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.2rem;
    text-align: left;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: #333;
  }

  input {
    width: 100%;
    padding: 0.8rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .signup-button {
    width: 100%;
    background: #4CAF50;
    color: white;
    padding: 0.8rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.3s;
  }

  .signup-button:hover {
    background: #45a049;
  }

  .error {
    color: #d32f2f;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .success {
    color: #4CAF50;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .login-prompt {
    margin-top: 1.5rem;
    font-size: 0.9rem;
  }

  .login-prompt a {
    color: #4CAF50;
    text-decoration: none;
  }

  .login-prompt a:hover {
    text-decoration: underline;
  }
</style>
