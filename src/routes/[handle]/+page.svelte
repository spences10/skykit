<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
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
	let analysing = $state(false);

	// Initialize user store with data only once when data changes
	let prev_data = $state<string>('');
	$effect(() => {
		const data_string = JSON.stringify(data);
		if (data_string !== prev_data) {
			// Ensure data has all required fields before updating store
			if (
				data &&
				data.profile &&
				data.engagement &&
				data.content &&
				data.temporal &&
				data.network
			) {
				user_store.update_data(data);
				store_initialized = true;
			}
			prev_data = data_string;
		}
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

<main class="container mx-auto max-w-4xl overflow-x-hidden p-4">
	<nav class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</nav>

	{#if store_initialized && data.profile}
		<ProfileCard />
		<SettingsPanel />
		<DataNotice />

		<div class="my-4 flex justify-center">
			<form
				method="POST"
				action="?/analyse_all"
				use:enhance={() => {
					analysing = true;
					return async ({ update, result }) => {
						await update();
						if (result.type === 'success' && result.data) {
							// Ensure result data has all required fields before updating store
							const result_data = result.data as PageData;
							if (
								result_data.profile &&
								result_data.engagement &&
								result_data.content &&
								result_data.temporal &&
								result_data.network
							) {
								user_store.update_data(result_data);
							}
						}
						analysing = false;
					};
				}}
			>
				<button
					class="btn btn-primary"
					type="submit"
					disabled={analysing}
				>
					{analysing ? 'Analysing All Posts...' : 'Analyse All Posts'}
				</button>
			</form>
		</div>

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
					class="mockup-code mt-2 max-w-full overflow-x-auto"
					transition:slide={{ duration: 300 }}
				>
					<p class="ml-3 mt-2">
						This is all the data that makes up this page.
					</p>
					<pre class="overflow-x-auto">
						<code>{JSON.stringify(data, null, 2)}</code>
					</pre>
				</div>
			{:else}
				<span class="sr-only">Raw data is currently hidden</span>
			{/if}
		</section>
	{/if}
</main>
