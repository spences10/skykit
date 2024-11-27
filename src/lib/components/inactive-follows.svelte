<script lang="ts">
	import type { Progress } from '$lib/inactive.svelte';
	import { inactive_state } from '$lib/inactive.svelte';
	import type { InactiveFollow, ProcessingStage } from '$lib/types';
	import {
		formatDate,
		formatDistanceToNow,
		isValid,
		parseISO,
	} from 'date-fns';

	let {
		inactive_follows = [],
		loading = false,
		progress,
	} = $props<{
		inactive_follows?: InactiveFollow[];
		loading?: boolean;
		progress: Progress;
	}>();

	// Get cache stats from the state
	const cache_stats = $derived(inactive_state.cache_stats);

	let elapsed_time = $derived(
		loading
			? progress.average_time_per_item
				? `About ${formatDistanceToNow(progress.start_time)}`
				: formatDistanceToNow(progress.start_time, {
						includeSeconds: true,
					})
			: '',
	);

	let progress_percent = $derived(
		progress.total
			? Math.round((progress.processed / progress.total) * 100)
			: 0,
	);

	let time_remaining = $derived.by(() => {
		if (!loading || !progress.average_time_per_item) return '';
		const remaining_items = progress.total - progress.processed;
		const estimated_seconds =
			remaining_items * progress.average_time_per_item;

		const hours = Math.floor(estimated_seconds / 3600);
		const minutes = Math.floor((estimated_seconds % 3600) / 60);
		const seconds = Math.floor(estimated_seconds % 60);

		if (hours > 0) {
			return `About ${hours}h ${minutes}m ${seconds}s`;
		} else if (minutes > 0) {
			return `About ${minutes}m ${seconds}s`;
		} else {
			return `About ${seconds}s`;
		}
	});

	const format_relative_time = (date: string): string => {
		if (!date || date === '1970-01-01T00:00:00.000Z') return 'Never';
		const parsed_date = parseISO(date);
		if (!isValid(parsed_date)) return 'Invalid date';
		return formatDistanceToNow(parsed_date, { addSuffix: true });
	};

	// Add number formatter
	const number_format = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	});

	function get_stage_description(
		stage: ProcessingStage,
		current_batch_source?: string,
	): string {
		// If there's a specific batch source message, use that
		if (current_batch_source) {
			return current_batch_source;
		}

		// Otherwise use the stage-specific description
		switch (stage) {
			case 'cache':
				return 'Checking database for cached data...';
			case 'follows':
				return 'Fetching follows from Bluesky API...';
			case 'profiles':
				return 'Processing profiles...';
			case 'feeds':
				return 'Fetching recent activity...';
			case 'complete':
				return 'Processing complete';
			default:
				const _exhaustiveCheck: never = stage;
				return 'Processing...';
		}
	}
</script>

<div class="space-y-6">
	{#if loading}
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body p-4 sm:p-6">
				<div class="flex flex-col items-center gap-6">
					<!-- Progress Bar -->
					<div class="w-full">
						<div class="mb-2 flex justify-between text-sm">
							<span class="text-base-content/70">
								{number_format.format(progress.processed)} of {number_format.format(
									progress.total,
								)}
							</span>
							<span class="font-medium text-primary">
								{progress_percent}%
							</span>
						</div>
						<progress
							class="progress progress-primary w-full"
							value={progress_percent}
							max="100"
						></progress>
					</div>

					<!-- Current Operation -->
					<div class="text-center">
						<div class="mb-3 flex items-center justify-center gap-3">
							<span
								class="loading loading-spinner loading-md text-primary"
							></span>
							<p class="text-lg font-medium text-base-content">
								{get_stage_description(
									progress.stage,
									progress.current_batch_source,
								)}
							</p>
						</div>
					</div>

					<!-- Timing Stats -->
					<div class="stats w-full bg-base-100 shadow">
						<div class="stat">
							<div class="stat-title">Time Elapsed</div>
							<div class="stat-value text-xl text-primary">
								{elapsed_time}
							</div>
						</div>
						{#if time_remaining}
							<div class="stat">
								<div class="stat-title">Estimated Time</div>
								<div class="stat-value text-xl text-secondary">
									{time_remaining}
								</div>
							</div>
						{/if}
						{#if progress.average_time_per_item && !progress.cached}
							<div class="stat">
								<div class="stat-title">Processing Speed</div>
								<div class="stat-value text-xl text-accent">
									{(1 / progress.average_time_per_item).toFixed(1)}
								</div>
								<div class="stat-desc">follows per second</div>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else if inactive_follows.length === 0}
		<div class="card bg-base-200 shadow-lg">
			<div class="card-body p-6 text-center">
				<div class="flex flex-col items-center gap-4">
					<div class="text-5xl">🦋</div>
					<p class="text-lg font-medium text-base-content/80">
						No inactive follows found
					</p>
				</div>
			</div>
		</div>
	{:else}
		<!-- Cache Statistics Summary -->
		{#if cache_stats}
			<div class="card bg-base-200 shadow-lg">
				<div class="card-body p-6">
					<div class="stats w-full bg-base-100 shadow">
						<div class="stat">
							<div class="stat-title">Cache Performance</div>
							<div class="stat-value text-2xl">
								{cache_stats.hit_rate || 0}% from cache
							</div>
							<div class="stat-desc mt-3">
								<div class="flex flex-wrap justify-center gap-2">
									<div class="badge badge-success badge-lg gap-2">
										<span class="font-medium">
											{number_format.format(cache_stats.cache_hits)}
										</span>
										<span class="opacity-80">from database</span>
									</div>
									<div class="badge badge-warning badge-lg gap-2">
										<span class="font-medium">
											{number_format.format(cache_stats.cache_misses)}
										</span>
										<span class="opacity-80">from API</span>
									</div>
								</div>
								<div class="mt-2 text-base-content/70">
									Total Processed: {number_format.format(
										cache_stats.total_processed,
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#each inactive_follows as follow (follow.did)}
			<div
				class="card bg-base-200 shadow-lg transition-shadow duration-200 hover:shadow-xl"
			>
				<div class="card-body p-6">
					<div
						class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
					>
						<div class="flex-1">
							<h3 class="text-lg font-bold text-base-content">
								{follow.displayName || follow.handle}
							</h3>
							<p class="text-base-content/70">
								<a
									href={`https://bsky.app/profile/${follow.handle}`}
									target="_blank"
									class="link link-primary"
									rel="noopener noreferrer"
								>
									@{follow.handle}
								</a>
							</p>
							<p class="mt-1 text-sm text-base-content/70">
								Joined {formatDate(follow.createdAt, 'MMM d, yyyy')}
								({format_relative_time(follow.createdAt)})
							</p>
						</div>
						<div class="flex flex-col items-start gap-1 sm:items-end">
							<p class="font-medium text-base-content/70">
								Last post: <span class="font-bold">
									{format_relative_time(follow.lastPost)}
								</span>
							</p>
							<div class="flex items-center gap-2">
								{#if follow.source}
									<div
										class="badge badge-sm {follow.source === 'cache'
											? 'badge-success'
											: 'badge-warning'}"
									>
										{follow.source === 'cache'
											? 'Source - DB'
											: 'Source - API'}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
