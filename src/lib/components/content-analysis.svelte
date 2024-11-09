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
			</h2>

			<!-- Post Types -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Post Types
					<div
						class="tooltip cursor-pointer"
						data-tip="Distribution of your different types of posts: original content, replies, and reposts"
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
							{user_store.data.content.post_types.original_posts.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">Direct posts to your feed</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-secondary">
							<Comment />
						</dt>
						<dd class="stat-title">Replies</dd>
						<dd class="stat-value text-secondary">
							{user_store.data.content.post_types.replies.toFixed(0)}
						</dd>
						<dd class="stat-desc">Responses to other posts</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Upload />
						</dt>
						<dd class="stat-title">Reposts</dd>
						<dd class="stat-value text-accent">
							{user_store.data.content.post_types.reposts.toFixed(0)}
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
						data-tip="How you format your posts with media and external links"
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
							{user_store.data.content.post_types.with_media.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">Posts containing images</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-success">
							<Link />
						</dt>
						<dd class="stat-title">Posts with Links</dd>
						<dd class="stat-value text-success">
							{user_store.data.content.post_types.with_links.toFixed(
								0,
							)}
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
						data-tip="Statistics about how long your posts typically are"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<dl class="stats shadow">
						<div class="stat">
							<dt class="stat-title">Average Length</dt>
							<dd class="stat-value">
								{user_store.data.content.post_lengths.average.toFixed(
									0,
								)}
							</dd>
							<dd class="stat-desc">characters per post</dd>
						</div>
						<div class="stat">
							<dt class="stat-title">Median Length</dt>
							<dd class="stat-value">
								{user_store.data.content.post_lengths.median}
							</dd>
							<dd class="stat-desc">typical post length</dd>
						</div>
					</dl>

					<section class="card bg-base-200 shadow">
						<div class="card-body">
							<h4 class="card-title text-sm">Length Distribution</h4>
							<dl class="space-y-2">
								<div class="flex items-center justify-between">
									<dt>Short (&#60;50 chars)</dt>
									<dd class="badge badge-primary">
										{user_store.data.content.post_lengths.distribution
											.short}
									</dd>
								</div>
								<div class="flex items-center justify-between">
									<dt>Medium (50-200)</dt>
									<dd class="badge badge-secondary">
										{user_store.data.content.post_lengths.distribution
											.medium}
									</dd>
								</div>
								<div class="flex items-center justify-between">
									<dt>Long (>200)</dt>
									<dd class="badge badge-accent">
										{user_store.data.content.post_lengths.distribution
											.long}
									</dd>
								</div>
							</dl>
						</div>
					</section>
				</div>
			</section>
		</div>
	</article>
{/if}
