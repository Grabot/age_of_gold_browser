<script lang="ts">
  import { signInWithGoogle } from '$lib/authLib/googleAuth';
  import { signInWithGithub } from '$lib/authLib/githubAuth';
  import { signInWithReddit } from '$lib/authLib/redditAuth';
  import { signInWithApple } from '$lib/authLib/appleAuth';
  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Error during Google login:', err);
      error = 'An error occurred during Google login.';
    }
  }
  async function handleGitHubLogin() {
    try {
      await signInWithGithub();
    } catch (err) {
      console.error('Error during GitHub login:', err);
      error = 'An error occurred during GitHub login.';
    }
  }
  async function handleRedditLogin() {
    try {
      await signInWithReddit();
    } catch (err) {
      console.error('Error during Reddit login:', err);
      error = 'An error occurred during Reddit login.';
    }
  }
  async function handleAppleLogin() {
    try {
      await signInWithApple();
    } catch (err) {
      console.error('Error during Apple login:', err);
      error = 'An error occurred during Apple login.';
    }
  }
  let error: string;
</script>

<div class="oauth-buttons">
  <button class="oauth-button google" on:click={handleGoogleLogin}>
    <img src="/oAuthButtons/google_button.png" alt="Google" class="oauth-img" />
  </button>
  <button class="oauth-button github" on:click={handleGitHubLogin}>
    <img src="/oAuthButtons/github_button.png" alt="Github" class="oauth-img" />
  </button>
  <button class="oauth-button reddit" on:click={handleRedditLogin}>
    <img src="/oAuthButtons/reddit_button.png" alt="Reddit" class="oauth-img" />
  </button>
  <button class="oauth-button apple" on:click={handleAppleLogin}>
    <img src="/oAuthButtons/apple_button.png" alt="Apple" class="oauth-img" />
  </button>
  {#if error}
    <p class="error">{error}</p>
  {/if}
</div>

<style>
  .oauth-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto;
    gap: 10px;
    margin-top: 20px;
    width: 100%;
    max-width: 200px;
    margin-left: auto;
    margin-right: auto;
  }
  .oauth-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    background-color: transparent;
    aspect-ratio: 1;
  }
  .oauth-button:hover {
    opacity: 0.9;
  }
  .oauth-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 5px;
  }
  .error {
    color: #a83232;
    margin-top: 10px;
    grid-column: 1 / -1;
  }
</style>
