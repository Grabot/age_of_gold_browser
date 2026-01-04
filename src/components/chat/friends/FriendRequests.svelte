<script lang="ts">
	import { friendStore } from "../../../stores/friendStore";
	
	export let getRandomColor: (username: string) => string;
	export let getInitial: (username: string) => string;
</script>

<div class="requests-list">
	<h3>Friend Requests</h3>
	<ul>
		<!-- Friend requests not implemented yet -->
		<li>No friend requests at this time</li>
	</ul>
</div>