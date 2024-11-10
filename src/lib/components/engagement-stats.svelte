<script lang="ts">
	import {
		Comment,
		Heart,
		InformationCircle,
		Refresh,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.engagement}
	<article class="card mb-11 bg-base-100 shadow-xl">
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
			</h2>

			<!-- Average per post stats -->
			<section class="mb-4">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Average Per Post
					<div
						class="tooltip cursor-pointer"
						data-tip="Average interactions received on your original posts"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<dl
					class="stats stats-vertical w-full shadow sm:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-figure text-primary">
							<Heart />
						</dt>
						<dd class="stat-title">Likes</dd>
						<dd class="stat-value text-primary">
							{user_store.data.engagement.engagement_metrics.likes.average.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.likes.total}
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-secondary">
							<Refresh />
						</dt>
						<dd class="stat-title">Reposts</dd>
						<dd class="stat-value text-secondary">
							{user_store.data.engagement.engagement_metrics.reposts.average.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.reposts.total}
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Comment />
						</dt>
						<dd class="stat-title">Replies</dd>
						<dd class="stat-value text-accent">
							{user_store.data.engagement.engagement_metrics.replies.average.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.replies.total}
						</dd>
					</div>
				</dl>
			</section>

			<!-- Other engagement metrics -->
			<section class="mt-4">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Other Engagement Metrics
					<div
						class="tooltip cursor-pointer"
						data-tip="Overall engagement performance and identification of high-performing posts"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<dl
					class="stats stats-vertical w-full shadow md:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-title">Total Engagement per Post</dt>
						<dd class="stat-value">
							{user_store.data.engagement.avg_engagement_per_post.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Combined average of all interactions
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-title">Viral Posts</dt>
						<dd class="stat-value">
							{user_store.data.engagement.viral_post_percentage.toFixed(
								0,
							)}%
						</dd>
						<dd class="stat-desc">
							Posts with 5+ engagements and 3x average
						</dd>
					</div>
				</dl>
			</section>

			<!-- Conversation metrics -->
			<section class="mt-4">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Conversation Metrics
					<div
						class="tooltip cursor-pointer"
						data-tip="How your posts contribute to and spark discussions"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<dl
					class="stats stats-vertical w-full shadow md:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-title">Conversation Starter Rate</dt>
						<dd class="stat-value">
							{user_store.data.engagement.conversation_starter_ratio.toFixed(
								0,
							)}%
						</dd>
						<dd class="stat-desc">
							Posts that received replies from others
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-title">Reply Rate</dt>
						<dd class="stat-value">
							{user_store.data.engagement.reply_rate.toFixed(0)}%
						</dd>
						<dd class="stat-desc">
							Your posts that are replies to others
						</dd>
					</div>
				</dl>
			</section>
		</div>
	</article>
{/if}
