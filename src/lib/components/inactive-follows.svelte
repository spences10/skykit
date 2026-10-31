<script lang="ts">
	import { inactive_state } from '#lib/inactive.svelte.js';
	import { flip } from 'svelte/animate';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import { slide } from 'svelte/transition';
	import CacheStats from './cache-stats.svelte';
	import EmptyState from './empty-state.svelte';
	import FollowCard from './follow-card.svelte';
	import InactiveProgress from './inactive-progress.svelte';

	let loading = $derived(inactive_state.loading);
	let process_started = $derived(inactive_state.process_started);
	let cache_stats = $derived(inactive_state.cache_stats);
	let follows = $derived(inactive_state.filtered_and_sorted_follows);
	let motion_ms = $derived(prefersReducedMotion.current ? 0 : 300);
</script>

<div>
	{#if loading}
		<div
			class="pb-6"
			transition:slide={{ duration: motion_ms, easing: cubicOut }}
		>
			<InactiveProgress />
		</div>
	{:else if process_started && follows.length === 0}
		<div
			class="pb-6"
			in:slide={{ duration: motion_ms, easing: cubicOut }}
		>
			<EmptyState text="No inactive follows found" />
		</div>
	{/if}

	{#if follows.length > 0}
		{#if cache_stats}
			<div
				class="pb-6"
				in:slide={{ duration: motion_ms, easing: cubicOut }}
			>
				<CacheStats />
			</div>
		{/if}

		<!-- pb instead of space-y so each gap slides with its block -->
		<div>
			{#each follows as follow (follow.did)}
				<div
					class="pb-6"
					in:slide={{ duration: motion_ms, easing: cubicOut }}
					animate:flip={{ duration: motion_ms, easing: cubicOut }}
				>
					<FollowCard {follow} />
				</div>
			{/each}
		</div>
	{/if}
</div>
