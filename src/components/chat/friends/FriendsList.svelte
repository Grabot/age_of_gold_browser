<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";
</script>

<div class="friends-list">
	<h3>Your Friends</h3>
	<ul>
		{#each $friendStore.friends as friendWithUser (friendWithUser.friend.friend_id)}
			<li>
				<!-- TODO: -->
			</li>
		{/each}
	</ul>
</div>

<style>
	.friends-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.friends-list h3 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.2rem;
		font-weight: 600;
	}

	.friends-list ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.friends-list li {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem;
		border-radius: 8px;
		transition: background-color 0.2s;
	}

	.friends-list li:hover {
		background-color: #f5f5f5;
	}
</style>