<script lang="ts">
	import {
		Comment,
		Heart,
		InformationCircle,
		LinkOutgoing,
		Refresh,
	} from '$lib/icons';
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';
	import { slide } from 'svelte/transition';
	let show_all_top_posts = $state(false);
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

			<!-- Average per post stats -->
			<section class="mb-6">
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
							{user_store.data.engagement.avg_likes_per_post.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement
								.engagement_distribution.likes.length}
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-secondary">
							<Refresh />
						</dt>
						<dd class="stat-title">Reposts</dd>
						<dd class="stat-value text-secondary">
							{user_store.data.engagement.avg_reposts_per_post.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement
								.engagement_distribution.reposts.length}
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Comment />
						</dt>
						<dd class="stat-title">Replies</dd>
						<dd class="stat-value text-accent">
							{user_store.data.engagement.avg_replies_per_post.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">
							Total: {user_store.data.engagement
								.engagement_distribution.replies.length}
						</dd>
					</div>
				</dl>
			</section>

			<!-- Engagement Overview -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
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
					class="stats stats-vertical w-full shadow sm:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-title">Total Engagement per Post</dt>
						<dd class="stat-value">
							{(
								user_store.data.engagement.avg_likes_per_post +
								user_store.data.engagement.avg_reposts_per_post +
								user_store.data.engagement.avg_replies_per_post
							).toFixed(0)}
						</dd>
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

			<!-- Conversation Metrics -->
			<section class="mb-6">
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
					class="stats stats-vertical w-full shadow sm:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-title">Conversation Starter Rate</dt>
						<dd class="stat-value">52%</dd>
						<dd class="stat-desc">
							Posts that received replies from others
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-title">Reply Rate</dt>
						<dd class="stat-value">71%</dd>
						<dd class="stat-desc">
							Your posts that are replies to others
						</dd>
					</div>
				</dl>
			</section>

			<!-- Interaction Patterns -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Interaction Patterns
					<div
						class="tooltip cursor-pointer"
						data-tip="How your posts receive engagement from others"
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
						<dt class="stat-title">Reply Engagement</dt>
						<dd class="stat-value">
							{user_store.data.engagement.reply_rate.toFixed(0)}%
						</dd>
						<dd class="stat-desc">Posts that received replies</dd>
					</div>

					<div class="stat">
						<dt class="stat-title">Repost Rate</dt>
						<dd class="stat-value">
							{user_store.data.engagement.repost_rate.toFixed(0)}%
						</dd>
						<dd class="stat-desc">
							{#if user_store.data.engagement.repost_rate >= 100}
								All your posts get reposted! 🔥
							{:else}
								Percentage of posts that get reposted
							{/if}
						</dd>
					</div>
				</dl>
			</section>

			{#if user_store.data.engagement.top_performing_posts.length > 0}
				<section class="mt-4">
					<header class="mb-2 flex items-center justify-between">
						<h3 class="flex items-center gap-2 text-lg font-semibold">
							Top Performing Posts
							<div
								class="tooltip cursor-pointer"
								data-tip="Your posts with the highest total engagement"
							>
								<InformationCircle
									class_names="h-4 w-4 text-base-content/60"
								/>
							</div>
						</h3>
						{#if user_store.data.engagement.top_performing_posts.length > 1}
							<button
								class="btn btn-ghost btn-sm"
								onclick={() =>
									(show_all_top_posts = !show_all_top_posts)}
							>
								{show_all_top_posts ? 'Show Less' : 'Show More'}
							</button>
						{/if}
					</header>

					<div class="space-y-4">
						<!-- First post always shown -->
						<div class="card shadow">
							<div class="card-body p-4">
								<p class="mb-4 text-base">
									{(
										user_store.data.engagement.top_performing_posts[0]
											.post.record as any
									).text}
								</p>
								<div class="flex items-center gap-6">
									<button
										class="btn btn-ghost btn-sm gap-2 text-primary"
									>
										<Heart class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(
												user_store.data.engagement
													.top_performing_posts[0].post.likeCount ||
													0,
											)}
										>
											{number_crunch(
												user_store.data.engagement
													.top_performing_posts[0].post.likeCount ||
													0,
											)}
										</span>
									</button>
									<button
										class="btn btn-ghost btn-sm gap-2 text-secondary"
									>
										<Refresh class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(
												user_store.data.engagement
													.top_performing_posts[0].post.repostCount ||
													0,
											)}
										>
											{number_crunch(
												user_store.data.engagement
													.top_performing_posts[0].post.repostCount ||
													0,
											)}
										</span>
									</button>
									<button
										class="btn btn-ghost btn-sm gap-2 text-accent"
									>
										<Comment class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(
												user_store.data.engagement
													.top_performing_posts[0].post.replyCount ||
													0,
											)}
										>
											{number_crunch(
												user_store.data.engagement
													.top_performing_posts[0].post.replyCount ||
													0,
											)}
										</span>
									</button>
									<a
										href={`https://bsky.app/profile/${user_store.data.engagement.top_performing_posts[0].post.author.handle}/post/${user_store.data.engagement.top_performing_posts[0].post.uri.split('/').pop()}`}
										target="_blank"
										rel="noopener noreferrer"
										class="btn btn-ghost btn-sm gap-2 text-info"
									>
										<LinkOutgoing class_names="h-6 w-6" />
										<span class="sr-only">View post</span>
									</a>
								</div>
							</div>
						</div>

						{#if show_all_top_posts}
							<div transition:slide>
								{#each user_store.data.engagement.top_performing_posts.slice(1, 10) as post}
									<div class="card mb-4 shadow">
										<div class="card-body p-4">
											<p class="mb-4 text-base">
												{(post.post.record as any).text}
											</p>
											<div class="flex items-center gap-6">
												<button
													class="btn btn-ghost btn-sm gap-2 text-primary"
												>
													<Heart class_names="h-6 w-6" />
													<span
														{...get_tooltip_props(
															post.post.likeCount || 0,
														)}
													>
														{number_crunch(post.post.likeCount || 0)}
													</span>
												</button>
												<button
													class="btn btn-ghost btn-sm gap-2 text-secondary"
												>
													<Refresh class_names="h-6 w-6" />
													<span
														{...get_tooltip_props(
															post.post.repostCount || 0,
														)}
													>
														{number_crunch(
															post.post.repostCount || 0,
														)}
													</span>
												</button>
												<button
													class="btn btn-ghost btn-sm gap-2 text-accent"
												>
													<Comment class_names="h-6 w-6" />
													<span
														{...get_tooltip_props(
															post.post.replyCount || 0,
														)}
													>
														{number_crunch(post.post.replyCount || 0)}
													</span>
												</button>
												<a
													href={`https://bsky.app/profile/${post.post.author.handle}/post/${post.post.uri.split('/').pop()}`}
													target="_blank"
													rel="noopener noreferrer"
													class="btn btn-ghost btn-sm gap-2 text-info"
												>
													<LinkOutgoing class_names="h-6 w-6" />
													<span class="sr-only">View post</span>
												</a>
											</div>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</section>
			{/if}
		</div>
	</article>
{/if}
