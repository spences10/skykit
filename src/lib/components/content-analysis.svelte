<script lang="ts">
	import { user_store } from '$lib/user-data.svelte';
	import {
		ContentHeader,
		ContentStyle,
		PostLength,
		PostTypes,
	} from './content';
</script>

{#if user_store.data.content}
	<article class="card bg-base-100 mb-11 shadow-xl">
		<div class="card-body">
			<ContentHeader />
			<PostTypes />
			<ContentStyle />
			<PostLength />
		</div>
	</article>
{/if}
