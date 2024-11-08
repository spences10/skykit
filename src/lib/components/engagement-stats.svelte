<script lang="ts">
	import { Comment, Heart, Refresh } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.engagement}
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Engagement Stats</h2>

			<!-- Average per post stats -->
			<div class="mb-4">
				<h3 class="mb-2 text-lg font-semibold">Average Per Post</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-figure text-primary">
							<Heart />
						</div>
						<div class="stat-title">Likes</div>
						<div class="stat-value text-primary">
							{user_store.data.engagement.engagement_metrics.likes.average.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.likes.total}
						</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-secondary">
							<Refresh />
						</div>
						<div class="stat-title">Reposts</div>
						<div class="stat-value text-secondary">
							{user_store.data.engagement.engagement_metrics.reposts.average.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.reposts.total}
						</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-accent">
							<Comment />
						</div>
						<div class="stat-title">Replies</div>
						<div class="stat-value text-accent">
							{user_store.data.engagement.engagement_metrics.replies.average.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Total: {user_store.data.engagement.engagement_metrics
								.replies.total}
						</div>
					</div>
				</div>
			</div>

			<!-- Other engagement metrics -->
			<div class="grid gap-4 md:grid-cols-2">
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Total Engagement per Post</div>
						<div class="stat-value">
							{user_store.data.engagement.avg_engagement_per_post.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Average likes + reposts + replies
						</div>
					</div>
				</div>

				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Viral Posts</div>
						<div class="stat-value">
							{user_store.data.engagement.viral_post_percentage.toFixed(
								0,
							)}%
						</div>
						<div class="stat-desc">
							Posts with 2x average engagement
						</div>
					</div>
				</div>
			</div>

			<!-- Conversation metrics -->
			<div class="mt-4">
				<h3 class="mb-2 text-lg font-semibold">
					Conversation Metrics
				</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-title">Conversation Starter Rate</div>
						<div class="stat-value">
							{(
								user_store.data.engagement
									.conversation_starter_ratio * 100
							).toFixed(0)}%
						</div>
						<div class="stat-desc">Posts that start discussions</div>
					</div>

					<div class="stat">
						<div class="stat-title">Reply Rate</div>
						<div class="stat-value">
							{(user_store.data.engagement.reply_rate * 100).toFixed(
								0,
							)}%
						</div>
						<div class="stat-desc">
							Percentage of posts that are replies
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
