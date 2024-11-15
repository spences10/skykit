<script lang="ts">
	import {
		Comment,
		Edit,
		Image,
		InformationCircle,
		Link,
		Upload,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.content}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Content Analysis
				<div
					class="tooltip cursor-pointer"
					data-tip="Breakdown of your posting habits and content patterns"
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

			<!-- Post Types -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Post Types
					<div
						class="tooltip cursor-pointer"
						data-tip="Breakdown of your posts by type (original posts, replies, and reposts)"
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
						<dt class="stat-figure text-primary">
							<Edit />
						</dt>
						<dd class="stat-title">Original Posts</dd>
						<dd class="stat-value text-primary">
							{user_store.data.content.post_types.text_only}
						</dd>
						<dd class="stat-desc">Direct posts to your feed</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-secondary">
							<Comment />
						</dt>
						<dd class="stat-title">Replies</dd>
						<dd class="stat-value text-secondary">
							{user_store.data.content.post_types.replies}
						</dd>
						<dd class="stat-desc">Responses to other posts</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Upload />
						</dt>
						<dd class="stat-title">Reposts</dd>
						<dd class="stat-value text-accent">
							{user_store.data.content.post_types.reposts}
						</dd>
						<dd class="stat-desc">Shared posts from others</dd>
					</div>
				</dl>
			</section>

			<!-- Content Style -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Content Style
					<div
						class="tooltip cursor-pointer"
						data-tip="How you format your original posts with media and external links"
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
						<dt class="stat-figure text-info">
							<Image />
						</dt>
						<dd class="stat-title">Media Posts</dd>
						<dd class="stat-value text-info">
							{user_store.data.content.post_types.with_media}
						</dd>
						<dd class="stat-desc">Posts containing images</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-success">
							<Link />
						</dt>
						<dd class="stat-title">Posts with Links</dd>
						<dd class="stat-value text-success">
							{user_store.data.content.post_types.with_links}
						</dd>
						<dd class="stat-desc">Posts containing external links</dd>
					</div>
				</dl>
			</section>

			<!-- Post Length Analysis -->
			<section>
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Post Length Analysis
					<div
						class="tooltip cursor-pointer"
						data-tip="Statistics about your average post length"
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
						<dt class="stat-title">Average Post Length</dt>
						<dd class="stat-value">
							{user_store.data.content.avg_post_length.toFixed(0)}
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
								Used {user_store.data.content
									.most_used_hashtags[0][1]} times
							</dd>
						</div>
					{/if}

					{#if user_store.data.content.media_engagement.image_posts.count > 0}
						<div class="stat">
							<dt class="stat-title">Media Engagement</dt>
							<dd class="stat-value">
								{user_store.data.content.media_engagement.image_posts.avg_engagement.toFixed(
									1,
								)}
							</dd>
							<dd class="stat-desc">
								average interactions per media post
							</dd>
						</div>
					{/if}
				</dl>
			</section>
		</div>
	</article>
{/if}
