<script lang="ts">
	import { inactive_state } from '$lib/inactive.svelte';
	import CacheStats from './cache-stats.svelte';
	import EmptyState from './empty-state.svelte';
	import FollowCard from './follow-card.svelte';
	import InactiveProgress from './inactive-progress.svelte';

	let loading = $derived(inactive_state.loading);
	let process_started = $derived(inactive_state.process_started);
	let cache_stats = $derived(inactive_state.cache_stats);
	let follows = $derived(inactive_state.filtered_and_sorted_follows);
</script>

<div class="space-y-6">
	{#if loading}
		<InactiveProgress />
	{:else if process_started && follows.length === 0}
		<EmptyState text="No inactive follows found" />
	{:else if follows.length > 0}
		{#if cache_stats}
			<CacheStats />
		{/if}

		{#each follows as follow (follow.did)}
			<FollowCard {follow} />
		{/each}
	{/if}
</div>
