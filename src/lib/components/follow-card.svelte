<script lang="ts">
	import type { InactiveFollow } from '$lib/types';
	import {
		formatDate,
		formatDistanceToNow,
		isValid,
		parseISO,
	} from 'date-fns';

	const { follow } = $props<{ follow: InactiveFollow }>();

	const format_relative_time = (date: string): string => {
		if (!date || date === '1970-01-01T00:00:00.000Z') return 'Never';
		const parsed_date = parseISO(date);
		if (!isValid(parsed_date)) return 'Invalid date';
		return formatDistanceToNow(parsed_date, { addSuffix: true });
	};
</script>

<div
	class="card bg-base-200 shadow-lg transition-shadow duration-200 hover:shadow-xl"
>
	<div class="card-body p-4 sm:p-6">
		<div
			class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
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
			<div class="flex flex-col gap-1">
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
					{#if follow.follows_back}
						<div class="badge badge-info badge-sm">Follows Back</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
