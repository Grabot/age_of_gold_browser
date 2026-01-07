<script>
	import { writable } from 'svelte/store';
	import OAuthButtons from './OAuthButtons.svelte';
	export let emailRegister;
	export let usernameRegister;
	export let passwordRegister;
	export let handleRegister;
	const localEmailRegister = writable('');
	const localUsernameRegister = writable('');
	const localPasswordRegister = writable('');
	$: $localEmailRegister = $emailRegister;
	$: $localUsernameRegister = $usernameRegister;
	$: $localPasswordRegister = $passwordRegister;
	$: emailRegister.set($localEmailRegister);
	$: usernameRegister.set($localUsernameRegister);
	$: passwordRegister.set($localPasswordRegister);
</script>

<div class="register-box">
	<h2>Sign up</h2>
	<div class="input-group">
		<input type="email" placeholder="Email" bind:value={$localEmailRegister} />
		<input type="text" placeholder="Username" bind:value={$localUsernameRegister} />
		<input type="password" placeholder="Password" bind:value={$localPasswordRegister} />
	</div>
	<button class="signup-button" on:click={handleRegister}>Sign up</button>

	<div class="oauth-container">
		<p class="oauth-divider">or sign up with</p>
		<OAuthButtons />
	</div>
</div>

<style>
	.register-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 350px;
		padding: 2rem;
		gap: 1.5rem;
		background-color: #dfc29c;
		border-radius: 12px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
		border: 1px solid #e0d5c8;
		position: relative;
		overflow: hidden;
	}

	.register-box::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: linear-gradient(90deg, #d4b18c, #b39a7d);
	}

	.register-box h2 {
		margin-bottom: 1rem;
		color: #5a3e2a;
		font-size: 1.8rem;
		font-weight: 600;
		text-align: center;
		font-family: 'Georgia', serif;
	}

	.input-group {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.register-box input {
		width: 100%;
		padding: 14px 16px;
		border: 1px solid #d4b18c;
		border-radius: 8px;
		background-color: #f5e7c1;
		color: #5a3e2a;
		font-size: 1rem;
		font-family: 'Arial', sans-serif;
	}

	.register-box input::placeholder {
		color: #8b6f47;
		opacity: 0.8;
		font-size: 0.9rem;
		font-family: 'Arial', sans-serif;
	}

	.register-box input:focus {
		outline: none;
		border-color: #b39a7d;
		background-color: #f0e0c9;
	}

	.register-box input:focus::placeholder {
		color: #b39a7d;
		opacity: 0.6;
		font-size: 0.9rem;
	}

	.signup-button {
		width: 100%;
		padding: 14px;
		background-color: #c29b73;
		color: #5a3e2a;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1rem;
		font-family: 'Georgia', serif;
	}

	.signup-button:hover {
		background-color: #b39a7d;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		color: #f9f5f0;
	}

	.oauth-container {
		width: 100%;
		margin-top: 1rem;
	}

	.oauth-divider {
		text-align: center;
		margin: 1rem 0;
		color: #5a3e2a;
		font-size: 0.9rem;
		position: relative;
		font-family: 'Arial', sans-serif;
	}

	.oauth-divider::before,
	.oauth-divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 25%;
		height: 1px;
		background-color: #d4b18c;
	}

	.oauth-divider::before {
		left: 0;
	}

	.oauth-divider::after {
		right: 0;
	}
</style>
