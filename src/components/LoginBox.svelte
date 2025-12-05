<script>
	import { writable } from 'svelte/store';
	import OAuthButtons from './OAuthButtons.svelte';
	export let usernameOrEmailLogin;
	export let passwordLogin;
	export let handleLogin;
	export let handleForgotPassword;
	const localUsernameOrEmailLogin = writable('');
	const localPasswordLogin = writable('');
	$: $localUsernameOrEmailLogin = $usernameOrEmailLogin;
	$: $localPasswordLogin = $passwordLogin;
	$: usernameOrEmailLogin.set($localUsernameOrEmailLogin);
	$: passwordLogin.set($localPasswordLogin);
</script>

<div class="login-box">
	<h2>Sign in</h2>
	<input type="text" placeholder="Username or Email" bind:value={$localUsernameOrEmailLogin} />
	<input type="password" placeholder="Password" bind:value={$localPasswordLogin} />
	<button type="button" class="forgot-password" on:click={handleForgotPassword}>
		Forgot password?
	</button>
	<button on:click={handleLogin}>Sign in</button>
	<div class="oauth-container">
		<p class="oauth-divider">or sign in with</p>
		<OAuthButtons />
	</div>
</div>

<style>
	.login-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		max-width: 350px;
		padding: 20px;
		gap: 15px;
	}
	.login-box h2 {
		margin-bottom: 20px;
		color: #5a3e2a;
		font-size: 1.5rem;
	}
	.login-box input {
		width: 100%;
		padding: 12px;
		margin-bottom: 10px;
		border: 1px solid #d4b18c;
		border-radius: 5px;
		background-color: #f5e7c1;
		color: #5a3e2a;
		font-size: 1rem;
	}
	.login-box button.forgot-password {
		background: none;
		width: fit-content;
		padding: 0;
		margin: 0 0 10px 0;
		text-align: right;
		align-self: flex-end;
		font-size: 0.9rem;
		font-weight: normal;
		color: #5a3e2a;
		text-decoration: underline;
		cursor: pointer;
		border: none;
		border-radius: 0;
	}
	.login-box button.forgot-password:hover {
		background: none;
		color: #b39a7d;
	}
	.login-box button {
		width: 100%;
		padding: 12px;
		background-color: #d4b18c;
		color: #5a3e2a;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		margin-bottom: 10px;
	}
	.login-box button:hover {
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
