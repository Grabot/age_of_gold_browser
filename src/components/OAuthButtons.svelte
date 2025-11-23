<script lang="ts">
  import { signInWithGoogle } from '$lib/authLib/googleAuth';
  import { signInWithGithub } from '$lib/authLib/githubAuth';
  import { signInWithReddit } from '$lib/authLib/redditAuth';
  import { signInWithApple } from '$lib/authLib/appleAuth';
  import { toast } from '@zerodevx/svelte-toast';


  async function handleGoogleLogin() {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error('Error during Google login:', err);
      toast.push('An error occurred during Google login.', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
    }
  }

  async function handleGitHubLogin() {
    try {
      await signInWithGithub();
    } catch (err) {
      console.error('Error during GitHub login:', err);
      toast.push('An error occurred during GitHub login.', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
    }
  }

  async function handleRedditLogin() {
    try {
      await signInWithReddit();
    } catch (err) {
      console.error('Error during Reddit login:', err);
      toast.push('An error occurred during Reddit login.', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
    }
  }

  async function handleAppleLogin() {
    try {
      await signInWithApple();
    } catch (err) {
      console.error('Error during Apple login:', err);
      toast.push('An error occurred during Apple login.', {
        theme: {
          '--toastColor': '#000000',
          '--toastBackground': '#EE4B2B',
          '--toastBarBackground': '#4A0404'
        }
      });
    }
  }
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
</div>

<style>
  .oauth-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    width: 100%;
  }

  .oauth-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    background-color: transparent;
    aspect-ratio: 1;
    height: 10vh;
  }

  .oauth-button:hover {
    opacity: 0.9;
    transform: scale(1.02);
    transition: all 0.2s ease;
  }

  .oauth-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 5px;
  }

</style>