<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import ActivityPatterns from './temporal/activity-patterns.svelte';
	import PeakActivityWindows from './temporal/peak-activity-windows.svelte';
	import PostingFrequency from './temporal/posting-frequency.svelte';
	import { safe_format_date } from './temporal/utils';

	let date_range_tooltip = $derived.by(() => {
		const date_range =
			user_store.data.temporal?.posting_frequency.date_range;
		if (!date_range) return '';

		const from_date = safe_format_date(date_range.from, 'PP');
		const to_date = safe_format_date(date_range.to, 'PP');
		return `Analysis from ${from_date} to ${to_date}`;
	});
</script>

{#if user_store.data.temporal}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<header class="mb-4 flex items-center gap-2">
				<h2 class="card-title">
					Posting Patterns
					<div
						class="tooltip cursor-pointer"
						data-tip="Analysis of when and how frequently you post"
					>
						<InformationCircle
							class_names="h-5 w-5 text-base-content/60"
						/>
					</div>
				</h2>

				{#if user_store.data.temporal.posting_frequency.date_range.from && user_store.data.temporal.posting_frequency.date_range.to}
					<div
						class="tooltip tooltip-right cursor-pointer"
						data-tip={date_range_tooltip}
					>
						<span class="badge badge-sm">
							{user_store.data.temporal.posting_frequency.date_range
								.total_days} days
						</span>
					</div>
				{/if}
			</header>

			<PostingFrequency />
			<ActivityPatterns />
			<PeakActivityWindows />
		</div>
	</article>
{/if}

<style>
	/* Add custom tooltip styles */
	:global(.tooltip) {
		--tooltip-tail: 3px;
		--tooltip-color: hsl(var(--p));
		--tooltip-text-color: hsl(var(--pc));
		max-width: none !important;
	}
</style>
