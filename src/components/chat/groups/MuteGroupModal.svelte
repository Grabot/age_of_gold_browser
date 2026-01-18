<script lang="ts">
	import { groupStore } from '../../../stores/groupStore';
	import { errorToast, successToast } from '../../../utils/toast';
	import type { Group } from '../../../types/groups';

	export let group: Group;
	export let onClose: () => void;
	export let groupColor: string = '#0b9476';
	export let textColor: string = 'white';

	let muteDurationHours: number | null = null;

	async function handleMuteGroup() {
		try {
			const mute = !group.mute;
			const success = await groupStore.muteGroup(group.group_id, mute, muteDurationHours);
			if (success) {
				successToast(mute ? 'Group muted' : 'Group unmuted');
				onClose();
			}
		} catch (error) {
			errorToast(error instanceof Error ? error.message : 'Unknown error');
		}
	}

	function handleOverlayClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}
</script>

<div
	class="modal"
	on:click={handleOverlayClick}
	on:keydown={(e) => {
		if (e.key === 'Escape') onClose();
		if (e.key === 'Enter' || e.key === ' ') {
			handleOverlayClick(e as unknown as MouseEvent);
		}
	}}
	tabindex="0"
	role="dialog"
	aria-modal="true"
	aria-label="Mute Group"
>
	<div class="modal-content">
		<div class="modal-header" style="background-color: {groupColor}; color: {textColor};">
			<h3>Mute Group</h3>
			<button class="close-btn" on:click={onClose}>×</button>
		</div>

		<div class="modal-body">
			<div class="mute-options">
				<div class="mute-duration">
					<label>
						<input
							type="radio"
							name="muteDuration"
							bind:group={muteDurationHours}
							value={null}
						/>
						Mute Indefinitely
					</label>
					<label>
						<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={1} />
						Mute for 1 hour
					</label>
					<label>
						<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={4} />
						Mute for 4 hours
					</label>
					<label>
						<input type="radio" name="muteDuration" bind:group={muteDurationHours} value={8} />
						Mute for 8 hours
					</label>
				</div>
				<button class="confirm-btn" on:click={handleMuteGroup} style="background-color: {groupColor}; color: {textColor};">
					Confirm {group.mute ? 'Unmute' : 'Mute'}
				</button>
			</div>
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
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1002;
	}

	.modal-content {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		width: 80%;
		max-width: 500px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
		position: relative;
	}

	.modal-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-radius: 12px 12px 0 0;
		margin: -2rem -2rem 1rem -2rem;
	}

	.modal-header h3 {
		margin: 0;
		font-size: 1.2rem;
	}

	.close-btn {
		background: none;
		border: none;
		color: white;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0;
		line-height: 1;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.mute-options {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.mute-duration {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin: 1rem 0;
	}

	.mute-duration label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		cursor: pointer;
	}

	.confirm-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: filter 0.2s;
		align-self: flex-end;
	}

	.confirm-btn:hover {
		filter: brightness(0.9);
	}
</style>