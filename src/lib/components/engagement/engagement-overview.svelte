<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	let totalEngagementPerPost = $derived.by(() => {
		if (!user_store.data.engagement) return '0';
		return (
			user_store.data.engagement.avg_likes_per_post +
			user_store.data.engagement.avg_reposts_per_post +
			user_store.data.engagement.avg_replies_per_post
		).toFixed(0);
	});
</script>

{#if user_store.data.engagement}
	<section class="mb-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Engagement Overview
			<div
				class="tooltip cursor-pointer"
				data-tip="Overall engagement performance metrics"
			>
				<InformationCircle
					class_names="h-4 w-4 text-base-content/60"
				/>
			</div>
		</h3>
		<dl
			class="stats stats-vertical sm:stats-horizontal w-full shadow"
		>
			<div class="stat">
				<dt class="stat-title">Total Engagement per Post</dt>
				<dd class="stat-value">{totalEngagementPerPost}</dd>
				<dd class="stat-desc">
					Combined average of all interactions
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-title">Viral Posts</dt>
				<dd class="stat-value">1%</dd>
				<dd class="stat-desc">
					Posts with 5+ engagements and 3x average
				</dd>
			</div>
		</dl>
	</section>
{/if}
