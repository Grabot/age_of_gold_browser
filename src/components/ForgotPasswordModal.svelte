<script lang="ts">
	export let onClose: () => void;
	export let onSubmit: (email: string) => void;
	let email = '';
	let emailInput: HTMLInputElement;

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleSubmit() {
		onSubmit(email);
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') {
			onClose();
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
>
	<div class="modal-content">
		<h2>Forgot Password</h2>
		<p>Enter your email to receive a password reset link.</p>
		<div class="email-section">
			<input
				type="email"
				bind:value={email}
				class="field-input"
				bind:this={emailInput}
				placeholder="Your email"
				on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
			/>
		</div>
		<div class="modal-actions">
			<button on:click={handleSubmit}>Send Password Reset Link</button>
			<button on:click={onClose}>Cancel</button>
		</div>
	</div>
</div>

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		border: none;
		padding: 0;
		margin: 0;
		cursor: default;
	}
	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 90%;
		max-width: 400px;
		text-align: center;
		position: relative;
	}
	.modal-content h2 {
		margin-top: 0;
		color: #2c3e50;
	}
	.email-section {
		position: relative;
		display: flex;
		justify-content: center;
		margin: 1.5rem auto;
	}
	.field-input {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		text-align: center;
	}
	.modal-actions {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 1.5rem;
	}
	.modal-actions button {
		background: #3498db;
		color: white;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 4px;
		cursor: pointer;
		transition: background 0.2s;
	}
	.modal-actions button:hover {
		background: #2980b9;
	}
	.modal-actions button:last-child {
		background: #e74c3c;
	}
	.modal-actions button:last-child:hover {
		background: #c0392b;
	}
</style>
