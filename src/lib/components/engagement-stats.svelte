<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import {
		AveragePerPost,
		ConversationMetrics,
		EngagementOverview,
		InteractionPatterns,
		TopPerformingPosts,
	} from './engagement';
</script>

{#if user_store.data.engagement}
	<article class="card bg-base-100 mb-11 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Engagement Stats
				<div
					class="tooltip cursor-pointer"
					data-tip="Analysis of interactions with your original posts (excluding reposts)"
				>
					<InformationCircle
						class_names="h-5 w-5 text-base-content/60"
					/>
				</div>
				{#if user_store.data.temporal?.posting_frequency.date_range}
					<div
						class="tooltip tooltip-right cursor-pointer"
						data-tip={`Analysis from ${new Date(user_store.data.temporal.posting_frequency.date_range.from).toLocaleDateString()} to ${new Date(user_store.data.temporal.posting_frequency.date_range.to).toLocaleDateString()}`}
					>
						<span class="badge badge-sm">
							{user_store.data.temporal.posting_frequency.date_range
								.total_days} days
						</span>
					</div>
				{/if}
			</h2>

			<AveragePerPost />
			<EngagementOverview />
			<ConversationMetrics />
			<InteractionPatterns />
			<TopPerformingPosts />
		</div>
	</article>
{/if}
