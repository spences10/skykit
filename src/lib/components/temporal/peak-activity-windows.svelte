<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { group_by_day } from './utils';
</script>

{#if user_store.data.temporal}
	<section class="mt-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Peak Activity Windows
			<div
				class="tooltip cursor-pointer"
				data-tip="Shows your most active posting times grouped by day of the week. Post counts are aggregated across multiple weeks."
			>
				<InformationCircle
					class_names="h-4 w-4 text-base-content/60"
				/>
			</div>
		</h3>
		<p class="mb-4 text-sm text-base-content/60">
			Showing your top 3 most active days and their busiest posting
			hours
		</p>
		<div class="join join-vertical w-full">
			{#each group_by_day(user_store.data.temporal.peak_activity_windows) as [day, times]}
				<div
					class="collapse join-item collapse-arrow border border-base-200"
				>
					<input type="checkbox" name="peak-activity-windows" />
					<div class="collapse-title text-sm font-medium">
						{day}
					</div>
					<div class="collapse-content">
						<div class="flex flex-wrap gap-2">
							{#each times as { timeRange, count }}
								<div class="flex items-center gap-1">
									<span class="badge badge-ghost">{timeRange}</span>
									<span class="badge badge-primary badge-sm"
										>{count}</span
									>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}
