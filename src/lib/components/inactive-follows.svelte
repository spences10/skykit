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

	const format_relative_time = (date: string): string => {
		if (!date || date === '1970-01-01T00:00:00.000Z') return 'Never';
		const parsed_date = parseISO(date);
		if (!isValid(parsed_date)) return 'Invalid date';
		return formatDistanceToNow(parsed_date, { addSuffix: true });
	};
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
					<div class="text-center">
						<p>
							Processing follows: {progress.processed} / {progress.total}
						</p>
						<p class="text-sm text-base-content/60">
							Currently checking: @{progress.current}
						</p>
						<p class="text-sm text-base-content/60">
							Time elapsed: {elapsed_time}
						</p>
					</div>
				</div>
			</div>
		</div>
	{:else if inactive_follows.length === 0}
		<div class="card bg-base-200">
			<div class="card-body text-center p-4 sm:p-6">
				<p>No inactive follows found</p>
			</div>
		</div>
	{:else}
		{#each inactive_follows as follow (follow.did)}
			<div class="card bg-base-200">
				<div class="card-body p-4 sm:p-6">
					<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div>
							<h3 class="font-bold break-all">
								{follow.displayName || follow.handle}
							</h3>
							<p class="text-sm text-base-content/60 break-all">
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
