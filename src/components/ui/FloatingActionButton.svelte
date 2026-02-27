<script lang="ts">
	export let onClick: () => void;
	export let icon: string = '👤';
	export let label: string = 'Add';
</script>

<div class="fab-container">
	<button class="fab-button" on:click={onClick} aria-label={label}>
		<span class="fab-icon">{icon}</span>
		<span class="fab-plus">+</span>
	</button>
</div>

<style>
	.fab-container {
		position: absolute;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 10;
	}

	.fab-button {
		background: var(--primary-colour);
		color: white;
		border: none;
		border-radius: 50%;
		width: 60px;
		height: 60px;
		font-size: 1.5rem;
		cursor: pointer;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		z-index: 1001;
	}

	.fab-button:hover {
		background: var(--primary-colour-dark);
	}

	.fab-icon {
		font-size: 1.2rem;
		margin-right: 2px;
	}

	.fab-plus {
		font-size: 1.5rem;
		font-weight: bold;
	}
</style>
