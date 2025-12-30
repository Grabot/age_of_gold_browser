<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";

	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;

</script>

<div class="friends-list">
	<h3>Your Friends</h3>
	<ul>
		{#each $friendStore.friends as friend}
		<li>
			<div
				class="friend-avatar"
				style="background-color: {getRandomColor(friend.name)}"
			>
				{getInitial(friend.name)}
			</div>
			<span>{friend.name}</span>
		</li>
		{/each}
	</ul>
</div>
