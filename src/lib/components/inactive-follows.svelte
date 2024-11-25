<script lang="ts">
	import type { Progress } from '$lib/inactive.svelte';
	import type { InactiveFollow } from '$lib/types';
	import { formatDistanceToNow, isValid, parseISO } from 'date-fns';

	let {
		inactive_follows = [],
		loading = false,
		progress,
	} = $props<{
		inactive_follows?: InactiveFollow[];
		loading?: boolean;
		progress: Progress;
	}>();

	let elapsed_time = $derived(
		loading
			? formatDistanceToNow(progress.start_time, {
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
</script>

<div class="space-y-4">
	{#if loading}
		<div class="card bg-base-200">
			<div class="card-body p-4 sm:p-6">
				<div class="flex flex-col items-center gap-4">
					<div class="w-full">
						<progress
							class="progress progress-primary w-full"
							value={progress_percent}
							max="100"
						></progress>
					</div>
					<div class="space-y-2 text-center">
						<div class="flex items-center justify-center gap-2">
							<span class="loading loading-spinner loading-sm"></span>
							<p class="font-medium">
								{#if progress.stage === 'follows'}
									Fetching follows...
								{:else if progress.stage === 'profiles'}
									Processing profiles...
								{:else if progress.stage === 'feeds'}
									Fetching recent activity...
								{:else}
									Processing...
								{/if}
							</p>
						</div>

						<!-- Overall Progress -->
						<div class="stats stats-vertical shadow sm:stats-horizontal">
							<div class="stat">
								<div class="stat-title">Overall Progress</div>
								<div class="stat-value text-4xl text-primary">
									{progress_percent}%
								</div>
							</div>

							<!-- Current Batch -->
							{#if progress.batch_progress}
								<div class="stat">
									<div class="stat-title">Current Batch</div>
									<div class="stat-value text-2xl text-secondary">
										{Math.round((progress.batch_progress.current / progress.batch_progress.total) * 100)}%
									</div>
									<div class="stat-desc">
										Processing: {number_format.format(progress.batch_progress.current)} of {number_format.format(progress.batch_progress.total)}
									</div>
								</div>
							{/if}

							<!-- Stage Info -->
							<div class="stat">
								<div class="stat-title">Current Stage</div>
								<div class="stat-value text-2xl text-accent capitalize">
									{progress.stage}
								</div>
								{#if progress.current}
									<div class="stat-value text-xl mt-2">
										{number_format.format(progress.processed)} of {number_format.format(progress.total)}
									</div>
								{/if}
							</div>
						</div>

						<!-- Timing Stats -->
						<div
							class="stats stats-vertical shadow sm:stats-horizontal"
						>
							<!-- Existing timing stats -->
							<div class="stat">
								<div class="stat-title">Time Elapsed</div>
								<div class="stat-value text-lg text-primary">
									{elapsed_time}
								</div>
							</div>
							{#if time_remaining}
								<div class="stat">
									<div class="stat-title">Estimated Time</div>
									<div class="stat-value text-lg text-secondary">
										{time_remaining}
									</div>
								</div>
							{/if}
							{#if progress.average_time_per_item && !progress.cached}
								<div class="stat">
									<div class="stat-title">Processing Speed</div>
									<div class="stat-value text-lg text-accent">
										{(1 / progress.average_time_per_item).toFixed(1)}
									</div>
									<div class="stat-desc">follows per second</div>
								</div>
							{/if}
						</div>

						<!-- Cache Stats -->
						{#if progress.cache_hits !== undefined}
							<div class="stats shadow">
								<div class="stat">
									<div class="stat-title">Cache Performance</div>
									<div class="stat-value text-lg">
										{Math.round(
											(progress.cache_hits / progress.total) * 100,
										)}%
									</div>
									<div
										class="stat-desc flex items-center justify-center gap-2"
									>
										<span class="badge badge-success"
											>{number_format.format(progress.cache_hits)} cached</span
										>
										<span class="badge badge-warning"
											>{number_format.format(progress.cache_misses)} fresh</span
										>
									</div>
								</div>
							</div>
						{/if}

						{#if progress.cached}
							<div class="badge badge-success gap-2">
								<span class="loading loading-ring loading-xs"></span>
								Using cached data
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else if inactive_follows.length === 0}
		<div class="card bg-base-200">
			<div class="card-body p-4 text-center sm:p-6">
				<p>No inactive follows found</p>
			</div>
		</div>
	{:else}
		{#each inactive_follows as follow (follow.did)}
			<div class="card bg-base-200">
				<div class="card-body p-4 sm:p-6">
					<div
						class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center"
					>
						<div>
							<h3 class="break-all font-bold">
								{follow.displayName || follow.handle}
							</h3>
							<p class="break-all text-sm text-base-content/60">
								<a
									href={`https://bsky.app/profile/${follow.handle}`}
									target="_blank"
									class="link"
									rel="noopener noreferrer"
								>
									@{follow.handle}
								</a>
							</p>
						</div>
						<div class="text-left sm:text-right">
							<p class="text-sm text-base-content/60">Last post:</p>
							<p class="font-medium">
								{format_relative_time(follow.lastPost)}
							</p>
						</div>
					</div>
				</div>
			</div>
		{/each}
	{/if}
</div>
