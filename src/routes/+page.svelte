<script lang="ts">
	import { goto } from '$app/navigation';
	import { MagnifyingGlass } from '$lib/icons';

	let handle = $state('');
	let loading = $state(false);

	const handle_search = async () => {
		if (!handle) return;
		loading = true;
		const cleaned_handle = handle.startsWith('@')
			? handle.slice(1)
			: handle;
		await goto(`/${cleaned_handle}`);
		loading = false;
	};

	const handle_keydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !loading && handle) {
			handle_search();
		}
	};
</script>

<svelte:head>
	<title>SkyKit - Bluesky User Stats</title>
	<meta
		name="description"
		content="SkyKit is a tool to get stats about Bluesky users."
	/>
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-xl p-4 pt-20">
		<div class="mb-12 text-center">
			<h1
				class="mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-extrabold leading-normal text-transparent"
			>
				SkyKit
			</h1>
			<p class="text-lg text-base-content/60">
				Check out your Bluesky user stats
			</p>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body">
				<div class="join w-full">
					<input
						type="text"
						bind:value={handle}
						onkeydown={handle_keydown}
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						spellcheck="false"
						placeholder="Enter Bluesky handle (e.g. alice.bsky.social)"
						class="input join-item input-bordered flex-1 focus:outline-none"
					/>
					<button
						onclick={handle_search}
						disabled={loading || !handle}
						class="btn btn-primary join-item"
					>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{:else}
							<MagnifyingGlass class_names="h-5 w-5" />
						{/if}
						<span class="ml-2">
							{loading ? null : 'Search'}
						</span>
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
