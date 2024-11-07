<script lang="ts">
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
								/>
							</svg>
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
								/>
							</svg>
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
