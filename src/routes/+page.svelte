<script lang="ts">
	import { goto } from '$app/navigation';
	import { MagnifyingGlass } from '$lib/icons';

	let handle = $state('');
	let loading = $state(false);

	const clean_handle = (value: string) => {
		return value.replace(/\s+/g, '').trim();
	};

	const handle_input = (e: Event) => {
		const input = e.target as HTMLInputElement;
		const cleaned = clean_handle(input.value);
		handle = cleaned;
		// Set cursor position to end of input
		input.value = cleaned;
		input.selectionStart = cleaned.length;
		input.selectionEnd = cleaned.length;
	};

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

<div class="container mx-auto max-w-xl p-4 pt-20">
	<div class="mb-12 text-center">
		<h1
			class="from-primary to-secondary mb-4 bg-gradient-to-r bg-clip-text text-5xl leading-normal font-extrabold text-transparent"
		>
			SkyKit
		</h1>
		<p class="text-base-content/60 text-lg">
			Check out your Bluesky user stats
		</p>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="join w-full">
				<input
					type="text"
					value={handle}
					oninput={handle_input}
					onkeydown={handle_keydown}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					placeholder="Enter handle (e.g. alice.bsky.social)"
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
