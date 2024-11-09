<script lang="ts">
	import {
		ApiStatus,
		ContentAnalysis,
		EngagementStats,
		Insights,
		NetworkAnalysis,
		ProfileCard,
		TemporalAnalysis,
	} from '$lib/components';
	import { Chevron } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { slide } from 'svelte/transition';

	let { data } = $props();
	let { profile, rate_limit } = data;

	$effect(() => {
		user_store.update_data(data);
	});

	let is_data_visible = $state(false);

	const toggle_data_view = () => (is_data_visible = !is_data_visible);
</script>

<svelte:head>
	<title>SkyKit - {profile.handle}</title>
	<meta
		name="description"
		content={`Check out ${profile.handle}'s Bluesky stats`}
	/>
</svelte:head>

<div class="container mx-auto max-w-4xl p-4">
	<div class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</div>

	<ProfileCard />
	<EngagementStats />
	<ContentAnalysis />
	<TemporalAnalysis />
	<NetworkAnalysis />
	<Insights />
	<ApiStatus />
	<button class="btn btn-ghost btn-sm" onclick={toggle_data_view}>
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
			<pre>{JSON.stringify(data, null, 2)}</pre>
		</div>
	{/if}
</div>
