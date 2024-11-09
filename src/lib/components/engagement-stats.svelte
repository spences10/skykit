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
					data-tip="Overview of how users interact with your posts through likes, reposts, and replies"
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
						data-tip="The typical number of interactions you receive on each post"
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
						data-tip="Additional metrics showing overall engagement performance and viral post success"
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
						<dt class="stat-title">Total Engagement per Post</dt>
						<dd class="stat-value">
							{user_store.data.engagement.avg_engagement_per_post.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Average likes + reposts + replies
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
							Posts with 2x average engagement
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
						data-tip="Measures how well your posts spark discussions and your participation in conversations"
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
						<dt class="stat-title">Conversation Starter Rate</dt>
						<dd class="stat-value">
							{(
								user_store.data.engagement
									.conversation_starter_ratio * 100
							).toFixed(0)}%
						</dd>
						<dd class="stat-desc">Posts that start discussions</dd>
					</div>

					<div class="stat">
						<dt class="stat-title">Reply Rate</dt>
						<dd class="stat-value">
							{(user_store.data.engagement.reply_rate * 100).toFixed(
								0,
							)}%
						</dd>
						<dd class="stat-desc">
							Percentage of posts that are replies
						</dd>
					</div>
				</dl>
			</section>
		</div>
	</article>
{/if}
