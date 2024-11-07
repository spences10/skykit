<script lang="ts">
	let { data } = $props();
	let {
		profile,
		rate_limit,
		engagement,
		content,
		temporal,
		network,
		account_classification,
		behavioural_insights,
		content_strategy_suggestions,
	} = data;

	const format_date = (date_string: string) => {
		return new Date(date_string).toLocaleString();
	};
</script>

<div class="container mx-auto max-w-3xl p-4">
	<div class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</div>

	<!-- Profile Card -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center gap-4">
				{#if profile.avatar}
					<div class="avatar">
						<div
							class="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"
						>
							<img
								src={profile.avatar}
								alt={`${profile.displayName}'s profile picture`}
							/>
						</div>
					</div>
				{/if}
				<div>
					<h2 class="card-title text-2xl">
						{profile.displayName}
					</h2>
					<p class="text-base-content/60">@{profile.handle}</p>
					<p class="mt-1 font-mono text-xs text-base-content/40">
						{profile.did}
					</p>
				</div>
			</div>

			<div class="stats mb-4 shadow">
				<div class="stat">
					<div class="stat-title">Followers</div>
					<div class="stat-value">{profile.followersCount}</div>
				</div>

				<div class="stat">
					<div class="stat-title">Following</div>
					<div class="stat-value">{profile.followsCount}</div>
				</div>

				<div class="stat">
					<div class="stat-title">Posts</div>
					<div class="stat-value">{profile.postsCount}</div>
				</div>
			</div>

			{#if profile.description}
				<div class="divider"></div>
				<p class="whitespace-pre-line text-base-content/80">
					{profile.description}
				</p>
			{/if}

			<div class="card-actions mt-4 justify-end">
				<div class="text-sm text-base-content/60">
					Last updated: {format_date(profile.indexedAt)}
				</div>
			</div>

			{#if rate_limit}
				<div class="mt-4">
					<div
						class="alert {rate_limit.is_limited
							? 'alert-warning'
							: 'alert-info'}"
					>
						<div>
							{#if rate_limit.is_limited}
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
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
									/>
								</svg>
							{:else}
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
										d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							{/if}
							<div>
								<h3 class="font-bold">API Status</h3>
								<div class="text-sm">
									{#if rate_limit.is_limited}
										Rate limit reached. Reset at {rate_limit.reset_time
											? format_date(rate_limit.reset_time.toString())
											: 'unknown'}
									{:else}
										{rate_limit.remaining_requests} requests remaining
									{/if}
									{#if rate_limit.queue_length > 0}
										<br />
										{rate_limit.queue_length} request{rate_limit.queue_length ===
										1
											? ''
											: 's'} in queue
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Engagement Stats -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Engagement Stats</h2>
			
			<!-- Average per post stats -->
			<div class="mb-4">
				<h3 class="font-semibold text-lg mb-2">Average Per Post</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-figure text-primary">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
							</svg>
						</div>
						<div class="stat-title">Likes</div>
						<div class="stat-value text-primary">{engagement.engagement_metrics.likes.average.toFixed(1)}</div>
						<div class="stat-desc">Total: {engagement.engagement_metrics.likes.total}</div>
					</div>
					
					<div class="stat">
						<div class="stat-figure text-secondary">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</div>
						<div class="stat-title">Reposts</div>
						<div class="stat-value text-secondary">{engagement.engagement_metrics.reposts.average.toFixed(1)}</div>
						<div class="stat-desc">Total: {engagement.engagement_metrics.reposts.total}</div>
					</div>
					
					<div class="stat">
						<div class="stat-figure text-accent">
							<svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
							</svg>
						</div>
						<div class="stat-title">Replies</div>
						<div class="stat-value text-accent">{engagement.engagement_metrics.replies.average.toFixed(1)}</div>
						<div class="stat-desc">Total: {engagement.engagement_metrics.replies.total}</div>
					</div>
				</div>
			</div>

			<!-- Other engagement metrics -->
			<div class="grid gap-4 md:grid-cols-2">
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Total Engagement per Post</div>
						<div class="stat-value">{engagement.avg_engagement_per_post.toFixed(1)}</div>
						<div class="stat-desc">Average likes + reposts + replies</div>
					</div>
				</div>

				<div class="stats shadow">
					<div class="stat">
						<div class="stat-title">Viral Posts</div>
						<div class="stat-value">{engagement.viral_post_percentage.toFixed(1)}%</div>
						<div class="stat-desc">Posts with 2x average engagement</div>
					</div>
				</div>
			</div>

			<!-- Conversation metrics -->
			<div class="mt-4">
				<h3 class="font-semibold text-lg mb-2">Conversation Metrics</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-title">Conversation Starter Rate</div>
						<div class="stat-value">{(engagement.conversation_starter_ratio * 100).toFixed(1)}%</div>
						<div class="stat-desc">Posts that start discussions</div>
					</div>
					
					<div class="stat">
						<div class="stat-title">Reply Rate</div>
						<div class="stat-value">{(engagement.reply_rate * 100).toFixed(1)}%</div>
						<div class="stat-desc">Percentage of posts that are replies</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Analysis -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Content Analysis</h2>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="stats stats-vertical shadow">
					<div class="stat">
						<div class="stat-title">Original Posts</div>
						<div class="stat-value">
							{content.post_types.original_posts.toFixed(0)}
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">Replies</div>
						<div class="stat-value">
							{content.post_types.replies.toFixed(0)}
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">With Media</div>
						<div class="stat-value">
							{content.post_types.with_media.toFixed(0)}
						</div>
					</div>
				</div>
				<div>
					<h3 class="mb-2 font-semibold">Post Length Distribution</h3>
					<ul class="space-y-2">
						<li>
							Short Posts: {content.post_lengths.distribution.short}
						</li>
						<li>
							Medium Posts: {content.post_lengths.distribution.medium}
						</li>
						<li>
							Long Posts: {content.post_lengths.distribution.long}
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>

	<!-- Add these sections after the Content Analysis card -->

	<!-- Temporal Analysis -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Posting Patterns</h2>
			<div class="grid gap-4 md:grid-cols-2">
				<div class="stats stats-vertical shadow">
					<div class="stat">
						<div class="stat-title">Posts per Day</div>
						<div class="stat-value">
							{temporal.posting_frequency.posts_per_day.toFixed(1)}
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">Active Days</div>
						<div class="stat-value">
							{temporal.posting_frequency.active_days_percentage.toFixed(
								0,
							)}%
						</div>
					</div>
					<div class="stat">
						<div class="stat-title">Longest Streak</div>
						<div class="stat-value">
							{temporal.posting_frequency.longest_streak} days
						</div>
					</div>
				</div>
				<div>
					<h3 class="mb-2 font-semibold">Peak Activity</h3>
					<div class="space-y-4">
						<div>
							<h4 class="text-sm font-medium">Most Active Hours</h4>
							<ul class="list-inside list-disc">
								{#each temporal.posting_frequency.most_active_hours.slice(0, 3) as [hour, count]}
									<li>{hour} ({count} posts)</li>
								{/each}
							</ul>
						</div>
						<div>
							<h4 class="text-sm font-medium">Most Active Days</h4>
							<ul class="list-inside list-disc">
								{#each temporal.posting_frequency.most_active_days.slice(0, 3) as [day, count]}
									<li>{day} ({count} posts)</li>
								{/each}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Network Analysis -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Network Analysis</h2>
			<div class="grid gap-6 md:grid-cols-2">
				<div>
					<h3 class="mb-2 font-semibold">Most Replied To</h3>
					<ul class="list-inside list-disc">
						{#each network.interaction_network.most_replied_to.slice(0, 5) as [handle, count]}
							<li>
								<a
									href={`https://bsky.app/profile/${handle}`}
									class="link link-primary"
								>
									@{handle}
								</a>
								({count} replies)
							</li>
						{/each}
					</ul>
				</div>
				<div>
					<h3 class="mb-2 font-semibold">Most Mentioned</h3>
					<ul class="list-inside list-disc">
						{#each network.interaction_network.most_mentioned.slice(0, 5) as [handle, count]}
							<li>
								<a
									href={`https://bsky.app/profile/${handle}`}
									class="link link-primary"
								>
									@{handle}
								</a>
								({count} mentions)
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</div>
	</div>

	<!-- Insights and Suggestions -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Account Insights</h2>

			<!-- Account Classification -->
			<div class="mb-4">
				<h3 class="mb-2 font-semibold">Account Type</h3>
				<div class="flex flex-wrap gap-2">
					{#each account_classification as classification}
						<span class="badge badge-primary">{classification}</span>
					{/each}
				</div>
			</div>

			<!-- Behavioural Insights -->
			<div class="mb-4">
				<h3 class="mb-2 font-semibold">Behavioural Insights</h3>
				<ul class="list-inside list-disc space-y-1">
					{#each behavioural_insights as insight}
						<li>{insight}</li>
					{/each}
				</ul>
			</div>

			<!-- Content Strategy -->
			<div>
				<h3 class="mb-2 font-semibold">
					Content Strategy Suggestions
				</h3>
				<ul class="list-inside list-disc space-y-1">
					{#each content_strategy_suggestions as suggestion}
						<li>{suggestion}</li>
					{/each}
				</ul>
			</div>
		</div>
	</div>
</div>
