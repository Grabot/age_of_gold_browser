<script>
  let email = '';
  let password = '';
  let error = '';

  function handleLogin() {
    // Add your login logic here, e.g., API call or validation
    if (!email || !password) {
      error = 'Please fill in all fields.';
      return;
    }
    error = '';
    // Proceed with login logic, e.g., redirect or API call
    console.log('Login attempt with:', email, password);
  }
</script>

<main class="login-page">
  <h1>Log In</h1>
  <p>Welcome back! Please log in to continue your adventure.</p>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  <form on:submit|preventDefault={handleLogin}>
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
      <label for="password">Password</label>
      <input
        type="password"
        id="password"
        bind:value={password}
        placeholder="Enter your password"
        required
      />
    </div>

    <button type="submit" class="login-button">Log In</button>
  </form>

  <p class="signup-prompt">
    Don't have an account? <a href="/signup">Sign up here</a>.
  </p>
</main>

<style>
  .login-page {
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

  .login-button {
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

  .login-button:hover {
    background: #45a049;
  }

  .error {
    color: #d32f2f;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  .signup-prompt {
    margin-top: 1.5rem;
    font-size: 0.9rem;
  }

  .signup-prompt a {
    color: #4CAF50;
    text-decoration: none;
  }

  .signup-prompt a:hover {
    text-decoration: underline;
  }
</style>
