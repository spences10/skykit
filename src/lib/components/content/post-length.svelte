<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';
</script>

<section>
	<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
		Post Length Analysis
		<div
			class="tooltip cursor-pointer"
			data-tip="Statistics about your average post length"
		>
			<InformationCircle class_names="h-4 w-4 text-base-content/60" />
		</div>
	</h3>
	<dl class="stats stats-vertical w-full shadow sm:stats-horizontal">
		<div class="stat">
			<dt class="stat-title">Average Post Length</dt>
			<dd class="stat-value">
				<span
					{...get_tooltip_props(
						user_store.data.content.avg_post_length,
					)}
				>
					{user_store.data.content.avg_post_length.toFixed(0)}
				</span>
			</dd>
			<dd class="stat-desc">characters per post</dd>
		</div>

		{#if user_store.data.content.most_used_hashtags.length > 0}
			<div class="stat">
				<dt class="stat-title">Top Hashtag</dt>
				<dd class="stat-value text-sm text-secondary">
					{user_store.data.content.most_used_hashtags[0][0]}
				</dd>
				<dd class="stat-desc">
					Used {user_store.data.content.most_used_hashtags[0][1]} times
				</dd>
			</div>
		{/if}

		{#if user_store.data.content.media_engagement.image_posts.count > 0}
			<div class="stat">
				<dt class="stat-title">Media Engagement</dt>
				<dd class="stat-value">
					<span
						{...get_tooltip_props(
							user_store.data.content.media_engagement.image_posts
								.avg_engagement,
						)}
					>
						{user_store.data.content.media_engagement.image_posts.avg_engagement.toFixed(
							1,
						)}
					</span>
				</dd>
				<dd class="stat-desc">average interactions per media post</dd>
			</div>
		{/if}
	</dl>
</section>
