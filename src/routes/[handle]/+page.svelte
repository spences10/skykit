<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import {
		ApiStatus,
		ContentAnalysis,
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
	import { crossfade } from 'svelte/transition';

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

	let { data } = $props();
	let { profile } = data;

	$effect(() => {
		user_store.update_data(data);
	});

	$effect(() => {
		if (browser) {
			visibility_state.load_sections($page.params.handle);
		}
	});

	let is_data_visible = $state(false);
	const toggle_data_view = () => (is_data_visible = !is_data_visible);

	const get_component = (section: string) => {
		switch (section) {
			case 'engagement':
				return EngagementStats;
			case 'content':
				return ContentAnalysis;
			case 'temporal':
				return TemporalAnalysis;
			case 'network':
				return NetworkAnalysis;
			case 'insights':
				return Insights;
			default:
				return null;
		}
	};
</script>

<svelte:head>
	<title>SkyKit - {profile.handle}</title>
	<meta
		name="description"
		content={`Check out ${profile.handle}'s Bluesky stats`}
	/>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<nav class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</nav>

	<ProfileCard />
	<SettingsPanel />

	<div class="sections">
		{#each visibility_state.sections as section (section)}
			<div
				animate:flip={{ duration: 400, easing: quintOut }}
				in:receive={{ key: section }}
				out:send={{ key: section }}
			>
				<svelte:component this={get_component(section)} />
			</div>
		{/each}
	</div>

	<ApiStatus />

	<!-- Debug section -->
	<section aria-label="Debug data">
		<button
			class="btn btn-ghost btn-sm"
			onclick={toggle_data_view}
			aria-expanded={is_data_visible}
		>
			{is_data_visible ? 'Hide' : 'Show'} page data
			<Chevron
				class_names="ml-2 h-4 w-4 transition-transform {is_data_visible
					? 'rotate-180'
					: ''}"
			/>
		</button>

		{#if is_data_visible}
			<p class="ml-3 mt-2">
				This is all the data that makes up this page.
			</p>
			<div
				class="mockup-code mt-2"
				transition:slide={{ duration: 300 }}
			>
				<pre><code>{JSON.stringify(data, null, 2)}</code></pre>
			</div>
		{/if}
	</section>
</main>
