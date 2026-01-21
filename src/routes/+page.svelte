<script lang="ts">
	import LoginBox from '../components/LoginBox.svelte';
	import RegisterBox from '../components/RegisterBox.svelte';
	import UserBox from '../components/UserBox.svelte';
	import { authStore } from '$lib/stores/authStore';
	import { writable } from 'svelte/store';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import ForgotPasswordModal from '../components/ForgotPasswordModal.svelte';
	import { forgotPassword } from '$lib/api/authApi';
	import { errorToast } from '$lib/utils/toast';

	const usernameOrEmailLogin = writable('');
	const passwordLogin = writable('');
	const emailRegister = writable('');
	const usernameRegister = writable('');
	const passwordRegister = writable('');

	function validateLoginFields(password: string, usernameOrEmail: string) {
		if (!password || !usernameOrEmail) {
			return { success: false, message: 'Please fill in all fields.' };
		}
		return { success: true };
	}

	async function handleLogin() {
		const usernameOrEmailValue = $usernameOrEmailLogin;
		const passwordValue = $passwordLogin;
		const validationResult = validateLoginFields(passwordValue, usernameOrEmailValue);
		if (!validationResult.success) {
			errorToast(validationResult.message || 'An error occurred during validation');
			return;
		}
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		const isEmail = emailRegex.test(usernameOrEmailValue);
		const emailValue = isEmail ? usernameOrEmailValue : null;
		const usernameValue = isEmail ? null : usernameOrEmailValue;
		const loginResult = await authStore.login(emailValue, usernameValue, passwordValue);
		if (loginResult) {
			// window.location.href = '/world';
		}
	}

	function validateRegisterFields(email: string, username: string, password: string) {
		if (!email || !username || !password) {
			return { success: false, message: 'Please fill in all fields.' };
		}
		return { success: true };
	}

	async function handleRegister() {
		const emailValue = $emailRegister;
		const usernameValue = $usernameRegister;
		const passwordValue = $passwordRegister;
		const validationResult = validateRegisterFields(emailValue, usernameValue, passwordValue);
		if (!validationResult.success) {
			errorToast(validationResult.message || 'An error occurred during validation');
			return;
		}
		const registerResult = await authStore.register(emailValue, usernameValue, passwordValue);
		if (registerResult) {
			setTimeout(() => {
				// window.location.href = '/world';
			}, 1500);
		}
	}

	let activeTab = 'SignIn';
	let isMobile = false;

	onMount(() => {
		if (browser) {
			checkIfMobile();
			window.addEventListener('resize', checkIfMobile);
			// Check if the user has visited before
			const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
			if (hasVisitedBefore) {
				activeTab = 'signIn';
			} else {
				activeTab = 'signUp';
				localStorage.setItem('hasVisitedBefore', 'true');
			}
		}
	});

	function checkIfMobile() {
		isMobile = window.innerWidth <= 768;
	}

	let showForgotPasswordModal = false;

	async function handleForgotPassword() {
		showForgotPasswordModal = true;
	}

	async function handleForgotPasswordSubmit(email: string) {
		try {
			const forgotPasswordResult: boolean = await forgotPassword(email);
			if (!forgotPasswordResult) {
				throw new Error('Failed to send reset email');
			} else {
				showForgotPasswordModal = false;
			}
		} catch (err) {
			return false;
		}
	}
</script>

<div class="fullscreen-image-container">
	<img src="/gradient.png" alt="Fullscreen" class="fullscreen-image" />

	{#if isMobile}
		<!-- Mobile layout: logo on top, login box below, both centered -->
		<div class="mobile-container">
			<img src="/age_of_gold_promo.png" alt="promo" class="mobile-promo-image" />
			<div class="overlay-box mobile-overlay">
				{#if $authStore.isAuthenticated}
					<UserBox />
				{:else}
					<div class="tab-container">
						<button
							class="tab-button"
							on:click={() => (activeTab = 'signIn')}
							class:active={activeTab === 'signIn'}>Sign in</button
						>
						<button
							class="tab-button"
							on:click={() => (activeTab = 'signUp')}
							class:active={activeTab === 'signUp'}>Sign up</button
						>
					</div>
					{#if activeTab === 'signIn'}
						<LoginBox {usernameOrEmailLogin} {passwordLogin} {handleLogin} {handleForgotPassword} />
					{:else}
						<RegisterBox {emailRegister} {usernameRegister} {passwordRegister} {handleRegister} />
					{/if}
				{/if}
			</div>
		</div>
	{:else}
		<!-- Desktop layout: logo on left, login box on right -->
		<img src="/age_of_gold_promo.png" alt="promo" class="promo-image" />
		<div class="overlay-box">
			{#if $authStore.isAuthenticated}
				<UserBox />
			{:else}
				<div class="tab-container">
					<button
						class="tab-button"
						on:click={() => (activeTab = 'signIn')}
						class:active={activeTab === 'signIn'}>Sign in</button
					>
					<button
						class="tab-button"
						on:click={() => (activeTab = 'signUp')}
						class:active={activeTab === 'signUp'}>Sign up</button
					>
				</div>
				{#if activeTab === 'signIn'}
					<LoginBox {usernameOrEmailLogin} {passwordLogin} {handleLogin} {handleForgotPassword} />
				{:else}
					<RegisterBox {emailRegister} {usernameRegister} {passwordRegister} {handleRegister} />
				{/if}
			{/if}
		</div>
	{/if}
	{#if showForgotPasswordModal}
		<ForgotPasswordModal
			onClose={() => (showForgotPasswordModal = false)}
			onSubmit={handleForgotPasswordSubmit}
		/>
	{/if}
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
		background-color: rgba(245, 231, 193, 0.95);
		border-radius: 10px;
		padding: 30px;
		width: 400px;
		max-width: 450px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
		border: 1px solid #d4b18c;
		position: absolute;
		top: 50%;
		right: 5%;
		transform: translateY(-50%);
		z-index: 10;
	}

	.tab-container {
		display: flex;
		width: 100%;
		margin-bottom: 20px;
	}

	.tab-button {
		flex: 1;
		padding: 10px;
		background-color: transparent;
		border: none;
		color: #5a3e2a;
		font-size: 1.1rem;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.3s ease;
	}

	.tab-button:last-child {
		margin-right: 0;
	}

	.tab-button.active {
		border-bottom: 2px solid #5a3e2a;
		font-weight: bold;
	}
	.fullscreen-image-container {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
	}
	.fullscreen-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.content-below-image {
		padding: 2rem;
		background: white;
	}
	.tab-container {
		display: flex;
		margin-bottom: 20px;
	}
	.tab-button {
		flex: 1;
		padding: 10px;
		background-color: #d4b18c;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		color: #5a3e2a;
		font-family: 'Times New Roman', Times, serif;
	}
	.tab-button.active {
		background-color: #b39a7d;
		color: #5a3e2a;
	}

	.promo-image {
		position: absolute;
		left: 10%;
		top: 50%;
		transform: translateY(-50%);
		width: 40%;
		height: auto;
		z-index: 1;
	}
	.mobile-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		padding: 20px;
		box-sizing: border-box;
	}

	.mobile-promo-image {
		width: 80%;
		max-width: 300px;
		margin-bottom: 30px;
		z-index: 10;
	}

	.mobile-overlay {
		width: 90%;
		max-width: 400px;
		position: relative;
		transform: none;
		top: auto;
		right: auto;
		margin-bottom: 20px;
	}

	/* Media query for mobile devices */
	@media (max-width: 768px) {
		.promo-image {
			display: none; /* Hide the desktop logo on mobile */
		}

		.overlay-box:not(.mobile-overlay) {
			display: none; /* Hide the desktop overlay on mobile */
		}
	}
</style>
