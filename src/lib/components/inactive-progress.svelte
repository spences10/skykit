<script lang="ts">
	import { inactive_state } from '$lib/inactive.svelte';
	import type { ProcessingStage } from '$lib/types';
	import {
		addSeconds,
		formatDuration,
		intervalToDuration,
	} from 'date-fns';

	let loading = $derived(inactive_state.loading);
	let progress = $derived(inactive_state.progress);

	const number_format = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	});

	const STAGE_DESCRIPTIONS = {
		cache: 'Checking database for cached data...',
		follows: 'Fetching follows from Bluesky API...',
		profiles: 'Processing profiles...',
		feeds: 'Fetching recent activity...',
		complete: 'Processing complete',
	} satisfies Record<ProcessingStage, string>;

	const get_stage_description = (
		stage: ProcessingStage,
		current_batch_source?: string,
	): string =>
		current_batch_source ||
		STAGE_DESCRIPTIONS[stage] ||
		'Processing...';

	let elapsed_time = $derived(
		loading
			? formatDuration(
					intervalToDuration({
						start: progress.start_time,
						end: new Date(),
					}),
					{ format: ['hours', 'minutes', 'seconds'], delimiter: ' ' },
				)
			: '',
	);

	let progress_percent = $derived(
		progress.total
			? Math.round((progress.processed / progress.total) * 100)
			: 0,
	);

	let time_remaining = $derived(
		(() => {
			if (!loading || !progress.average_time_per_item) return '';
			const remaining_items = progress.total - progress.processed;
			const estimated_seconds =
				remaining_items * progress.average_time_per_item;

			const duration = intervalToDuration({
				start: new Date(),
				end: addSeconds(new Date(), estimated_seconds),
			});

			return formatDuration(duration, {
				format: ['hours', 'minutes', 'seconds'],
				delimiter: ' ',
			});
		})(),
	);
</script>

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
					<span class="text-primary font-medium">
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
					<p class="text-base-content text-lg font-medium">
						{get_stage_description(
							progress.stage,
							progress.current_batch_source,
						)}
					</p>
				</div>
			</div>

			<!-- Timing Stats -->
			<div
				class="sm:stats sm:bg-base-100 grid w-full grid-cols-1 gap-4 sm:grid-cols-3 sm:shadow"
			>
				<div class="stat bg-base-100 shadow sm:shadow-none">
					<div class="stat-title">Time Elapsed</div>
					<div class="stat-value text-primary text-xl">
						{elapsed_time}
					</div>
					<div class="stat-desc">total elapsed time</div>
				</div>

				{#if time_remaining}
					<div class="stat bg-base-100 shadow sm:shadow-none">
						<div class="stat-title">Estimated Time</div>
						<div class="stat-value text-secondary text-xl">
							{time_remaining}
						</div>
						<div class="stat-desc">estimate for this batch</div>
					</div>
				{/if}

				{#if progress.average_time_per_item && !progress.cached}
					<div class="stat bg-base-100 shadow sm:shadow-none">
						<div class="stat-title">Processing Speed</div>
						<div class="stat-value text-accent text-xl">
							{(1 / progress.average_time_per_item).toFixed(1)}
						</div>
						<div class="stat-desc">follows per second</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
