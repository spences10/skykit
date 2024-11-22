<script lang="ts">
	import type { InactiveFollow } from '$lib/types';
	import { formatDistanceToNow } from 'date-fns';

	export let inactive_follows: InactiveFollow[] = [];
	export let loading = false;

	const format_relative_time = (date: string): string => {
		const parsed_date = new Date(date);
		if (parsed_date.getTime() === 0) return 'Never';
		return formatDistanceToNow(parsed_date, { addSuffix: true });
	};
</script>

<div class="space-y-4">
	{#if loading}
		<div class="card bg-base-200">
			<div class="card-body text-center">
				<span class="loading loading-spinner"></span>
				<p>Loading inactive follows...</p>
			</div>
		</div>
	{:else if inactive_follows.length === 0}
		<div class="card bg-base-200">
			<div class="card-body text-center">
				<p>No inactive follows found</p>
			</div>
		</div>
	{:else}
		{#each inactive_follows as follow (follow.did)}
			<div class="card bg-base-200">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<div>
							<h3 class="font-bold">
								{follow.displayName || follow.handle}
							</h3>
							<p class="text-sm text-base-content/60">
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
						<div class="text-right">
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
