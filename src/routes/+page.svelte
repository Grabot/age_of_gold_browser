<script>
  // You can add logic here if needed, e.g., for handling form submissions
</script>

<main class="welcome-page">
  <h1>Welcome to Our Game!</h1>
  <p>Join the adventure and start playing today. Create your account to unlock all features and save your progress.</p>

  <div class="cta-section">
    <h2>Ready to play?</h2>
    <a href="/signup" class="signup-button">Create an Account</a>
    <p class="login-prompt">Already have an account? <a href="/login">Log in here</a>.</p>
  </div>
</main>

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
    background: #4CAF50;
    color: white;
    padding: 0.8rem 1.5rem;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
    font-size: 1.1rem;
    margin: 1rem 0;
    transition: background 0.3s;
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
  }

  .login-prompt a:hover {
    text-decoration: underline;
  }
</style>
