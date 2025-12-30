<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";

	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

	function handleAcceptRequest(requestId: number) {
        // TODO:
		// friendStore.acceptRequest(requestId);
	}
</script>

<div class="requests-list">
	<h3>Friend Requests</h3>
	<ul>
		{#each $friendStore.friendRequests as request}
		<li>
			<div
				class="friend-avatar"
				style="background-color: {getRandomColor(request.name)}"
			>
				{getInitial(request.name)}
			</div>
			<span>{request.name}</span>
			<button class="accept-btn" on:click={() => handleAcceptRequest(request.id)}>
				Accept
			</button>
		</li>
		{/each}
	</ul>
</div>
