<script lang="ts">
	import { goto } from '$app/navigation';

	let handle = $state('');
	let loading = $state(false);

	const handle_search = async () => {
		if (!handle) return;
		loading = true;
		await goto(`/${handle}`);
		loading = false;
	};

	const handle_keydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !loading && handle) {
			handle_search();
		}
	};
</script>

<div class="container mx-auto max-w-3xl p-4">
	<h1 class="mb-6 text-3xl font-bold">Bluesky User Stats</h1>

	<div class="mb-6">
		<div class="join w-full">
			<input
				type="text"
				bind:value={handle}
				onkeydown={handle_keydown}
				placeholder="Enter Bluesky handle (e.g. alice.bsky.social)"
				class="input join-item input-bordered flex-1"
			/>
			<button
				onclick={handle_search}
				disabled={loading || !handle}
				class="btn btn-primary join-item"
			>
				{#if loading}
					<span class="loading loading-spinner"></span>
				{/if}
				{loading ? 'Loading...' : 'Search'}
			</button>
		</div>
	</div>
</div>
