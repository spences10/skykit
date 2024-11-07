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
		</div>
	</div>

	<!-- Engagement Stats -->
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
							{engagement.engagement_metrics.likes.average.toFixed(0)}
						</div>
						<div class="stat-desc">
							Total: {engagement.engagement_metrics.likes.total}
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
							{engagement.engagement_metrics.reposts.average.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Total: {engagement.engagement_metrics.reposts.total}
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
							{engagement.engagement_metrics.replies.average.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">
							Total: {engagement.engagement_metrics.replies.total}
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
							{engagement.avg_engagement_per_post.toFixed(0)}
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
							{engagement.viral_post_percentage.toFixed(0)}%
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
							{(engagement.conversation_starter_ratio * 100).toFixed(
								0,
							)}%
						</div>
						<div class="stat-desc">Posts that start discussions</div>
					</div>

					<div class="stat">
						<div class="stat-title">Reply Rate</div>
						<div class="stat-value">
							{(engagement.reply_rate * 100).toFixed(0)}%
						</div>
						<div class="stat-desc">
							Percentage of posts that are replies
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Content Analysis -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Content Analysis</h2>

			<!-- Post Types -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Post Types</h3>
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
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</div>
						<div class="stat-title">Original Posts</div>
						<div class="stat-value text-primary">
							{content.post_types.original_posts.toFixed(0)}
						</div>
						<div class="stat-desc">Direct posts to your feed</div>
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
									d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
								/>
							</svg>
						</div>
						<div class="stat-title">Replies</div>
						<div class="stat-value text-secondary">
							{content.post_types.replies.toFixed(0)}
						</div>
						<div class="stat-desc">Responses to other posts</div>
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
									d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
								/>
							</svg>
						</div>
						<div class="stat-title">Reposts</div>
						<div class="stat-value text-accent">
							{content.post_types.reposts.toFixed(0)}
						</div>
						<div class="stat-desc">Shared posts from others</div>
					</div>
				</div>
			</div>

			<!-- Content Style -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Content Style</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-figure text-info">
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
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div class="stat-title">Media Posts</div>
						<div class="stat-value text-info">
							{content.post_types.with_media}
						</div>
						<div class="stat-desc">Posts containing images</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-success">
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
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>
						</div>
						<div class="stat-title">Posts with Links</div>
						<div class="stat-value text-success">
							{content.post_types.with_links.toFixed(0)}
						</div>
						<div class="stat-desc">
							Posts containing external links
						</div>
					</div>
				</div>
			</div>

			<!-- Post Length Analysis -->
			<div>
				<h3 class="mb-2 text-lg font-semibold">
					Post Length Analysis
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="stats shadow">
						<div class="stat">
							<div class="stat-title">Average Length</div>
							<div class="stat-value">
								{content.post_lengths.average.toFixed(0)}
							</div>
							<div class="stat-desc">characters per post</div>
						</div>
						<div class="stat">
							<div class="stat-title">Median Length</div>
							<div class="stat-value">
								{content.post_lengths.median}
							</div>
							<div class="stat-desc">typical post length</div>
						</div>
					</div>

					<div class="card bg-base-200">
						<div class="card-body">
							<h4 class="card-title text-sm">Length Distribution</h4>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<span>Short (&#60;50 chars)</span>
									<span class="badge badge-primary">
										{content.post_lengths.distribution.short}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Medium (50-200)</span>
									<span class="badge badge-secondary"
										>{content.post_lengths.distribution.medium}</span
									>
								</div>
								<div class="flex items-center justify-between">
									<span>Long (>200)</span>
									<span class="badge badge-accent"
										>{content.post_lengths.distribution.long}</span
									>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Temporal Analysis -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Posting Patterns</h2>

			<!-- Posting Frequency -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Posting Frequency</h3>
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
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<div class="stat-title">Daily Posts</div>
						<div class="stat-value text-primary">
							{temporal.posting_frequency.posts_per_day.toFixed(0)}
						</div>
						<div class="stat-desc">Average posts per day</div>
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
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<div class="stat-title">Active Days</div>
						<div class="stat-value text-secondary">
							{temporal.posting_frequency.active_days_percentage.toFixed(
								0,
							)}%
						</div>
						<div class="stat-desc">Days with at least one post</div>
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
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<div class="stat-title">Posting Streak</div>
						<div class="stat-value text-accent">
							{temporal.posting_frequency.longest_streak.toFixed(0)}
						</div>
						<div class="stat-desc">Consecutive days posting</div>
					</div>
				</div>
			</div>

			<!-- Activity Patterns -->
			<div class="grid gap-4 md:grid-cols-2">
				<!-- Peak Hours -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">Most Active Hours</h3>
						<ul class="space-y-2">
							{#each temporal.posting_frequency.most_active_hours.slice(0, 3) as [hour, count]}
								<div class="flex items-center justify-between">
									<span>{hour}</span>
									<span class="badge badge-primary"
										>{count} posts</span
									>
								</div>
							{/each}
						</ul>
					</div>
				</div>

				<!-- Active Days -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">Most Active Days</h3>
						<ul class="space-y-2">
							{#each temporal.posting_frequency.most_active_days.slice(0, 3) as [day, count]}
								<div class="flex items-center justify-between">
									<span>{day}</span>
									<span class="badge badge-secondary"
										>{count} posts</span
									>
								</div>
							{/each}
						</ul>
					</div>
				</div>
			</div>

			<!-- Peak Activity Windows -->
			<div class="mt-6">
				<h3 class="mb-2 text-lg font-semibold">
					Peak Activity Windows
				</h3>
				<div class="flex flex-wrap gap-2">
					{#each temporal.peak_activity_windows as window}
						<span class="badge badge-lg">{window}</span>
					{/each}
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

	<!-- API Status -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				<span>API Status</span>
				{#if rate_limit.is_limited}
					<div class="badge badge-warning gap-2">
						<span class="loading loading-spinner loading-xs"></span>
						Rate Limited
					</div>
				{:else}
					<div class="badge badge-success gap-2">
						<span class="loading loading-ring loading-xs"></span>
						Healthy
					</div>
				{/if}
			</h2>

			<div class="grid gap-4 md:grid-cols-2">
				<!-- Request Stats -->
				<div class="stats shadow">
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
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
						</div>
						<div class="stat-title">Remaining Requests</div>
						<div class="stat-value text-primary">
							{rate_limit.remaining_requests}
						</div>
						<div class="stat-desc">of 3000 per hour</div>
					</div>
				</div>

				<!-- Queue Status -->
				<div class="stats shadow">
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
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
						</div>
						<div class="stat-title">Queue Length</div>
						<div class="stat-value text-secondary">
							{rate_limit.queue_length}
						</div>
						<div class="stat-desc">requests waiting</div>
					</div>
				</div>
			</div>

			<!-- Rate Limit Info -->
			{#if rate_limit.is_limited}
				<div class="alert alert-warning mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					<div>
						<h3 class="font-bold">Rate Limit Reached</h3>
						<div class="text-sm">
							Reset at {format_date(
								rate_limit.reset_time?.toString() ??
									new Date().toISOString(),
							)}
						</div>
					</div>
				</div>
			{:else}
				<div class="alert alert-info mt-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<h3 class="font-bold">API is responding normally</h3>
						<div class="text-sm">
							Next reset: {format_date(
								rate_limit.reset_time?.toString() ??
									new Date().toISOString(),
							)}
						</div>
					</div>
				</div>
			{/if}

			<!-- Cache Status -->
			<div class="mt-4">
				<div class="flex items-center gap-2">
					<h3 class="font-semibold">Cache Status</h3>
					<div class="badge badge-neutral">15 min TTL</div>
				</div>
				<p class="mt-2 text-sm text-base-content/70">
					Data is cached for 15 minutes to reduce API load. Last
					fetched: {format_date(profile.indexedAt)}
				</p>
			</div>
		</div>
	</div>
</div>
