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
	import { user_store } from '$lib/user-data.svelte';

	let { data } = $props();
	let { profile, rate_limit } = data;

	$effect(() => {
		user_store.update_data(data);
	});
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
</div>
