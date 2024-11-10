<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import {
		ContentAnalysis,
		DataNotice,
		EngagementStats,
		Insights,
		NetworkAnalysis,
		ProfileCard,
		SettingsPanel,
		TemporalAnalysis,
	} from '$lib/components';
	import { Chevron } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { visibility_state } from '$lib/visibility.svelte';
	import { flip } from 'svelte/animate';
	import { quintOut } from 'svelte/easing';
	import { crossfade, slide } from 'svelte/transition';
	import type { PageData } from './$types';

	const [send, receive] = crossfade({
		duration: (d) => Math.sqrt(d * 200),
		fallback(node, params) {
			const style = getComputedStyle(node);
			const transform =
				style.transform === 'none' ? '' : style.transform;

			return {
				duration: 400,
				easing: quintOut,
				css: (t) => `
					transform: ${transform} scale(${t});
					opacity: ${t}
				`,
			};
		},
	});

	let { data } = $props<{ data: PageData }>();
	let store_initialized = $state(false);

	// Initialize user store with data
	$effect(() => {
		user_store.update_data(data);
		store_initialized = true;
	});

	$effect(() => {
		if (browser) {
			visibility_state.load_sections($page.params.handle);
		}
	});

	let is_data_visible = $state(false);
	const toggle_data_view = () => (is_data_visible = !is_data_visible);
</script>

<svelte:head>
	<title>SkyKit - {data.profile?.handle || 'Loading...'}</title>
	<meta
		name="description"
		content={`Check out ${data.profile?.handle || ''}'s Bluesky stats`}
	/>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<nav class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</nav>

	{#if store_initialized && data.profile}
		<ProfileCard />
		<SettingsPanel />
		<DataNotice />
		<div class="sections">
			{#each visibility_state.sections as section (section)}
				<div
					animate:flip={{ duration: 400, easing: quintOut }}
					in:receive={{ key: section }}
					out:send={{ key: section }}
				>
					{#if section === 'engagement'}
						<EngagementStats />
					{:else if section === 'content'}
						<ContentAnalysis />
					{:else if section === 'temporal'}
						<TemporalAnalysis />
					{:else if section === 'network'}
						<NetworkAnalysis />
					{:else if section === 'insights'}
						<Insights />
					{/if}
				</div>
			{/each}
		</div>

		<!-- Raw Data View -->
		<section aria-label="Raw data view">
			<button
				class="btn btn-ghost btn-sm"
				onclick={toggle_data_view}
				aria-expanded={is_data_visible}
				aria-controls="raw-data"
			>
				{is_data_visible ? 'Hide' : 'Show'} raw data
				<Chevron
					class_names="ml-2 h-4 w-4 transition-transform {is_data_visible
						? 'rotate-180'
						: ''}"
				/>
			</button>

			{#if is_data_visible}
				<div
					id="raw-data"
					class="mockup-code mt-2"
					transition:slide={{ duration: 300 }}
				>
					<p class="ml-3 mt-2">
						This is all the data that makes up this page.
					</p>
					<pre><code>{JSON.stringify(data, null, 2)}</code></pre>
				</div>
			{:else}
				<span class="sr-only">Raw data is currently hidden</span>
			{/if}
		</section>
	{/if}
</main>
