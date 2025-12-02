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
	<input type="email" placeholder="Email" bind:value={$localEmailRegister} />
	<input type="text" placeholder="Username" bind:value={$localUsernameRegister} />
	<input type="password" placeholder="Password" bind:value={$localPasswordRegister} />
	<button on:click={handleRegister}>Sign up</button>

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
		padding: 20px;
		gap: 15px;
	}

	.register-box h2 {
		margin-bottom: 20px;
		color: #5a3e2a;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1.5rem;
	}

	.register-box input {
		width: 100%;
		padding: 12px;
		margin-bottom: 10px;
		border: 1px solid #d4b18c;
		border-radius: 5px;
		background-color: #f5e7c1;
		color: #5a3e2a;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1rem;
	}

	.register-box button {
		width: 100%;
		padding: 12px;
		background-color: #d4b18c;
		color: #5a3e2a;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-family: 'Times New Roman', Times, serif;
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 10px;
	}

	.register-box button:hover {
		background-color: #b39a7d;
	}

	.oauth-container {
		width: 100%;
		margin-top: 10px;
	}

	.oauth-divider {
		text-align: center;
		margin: 10px 0;
		color: #5a3e2a;
		font-size: 0.9rem;
		font-family: 'Times New Roman', Times, serif;
		position: relative;
	}

	.oauth-divider::before,
	.oauth-divider::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 45%;
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
