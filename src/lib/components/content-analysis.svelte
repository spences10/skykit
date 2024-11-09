<script lang="ts">
	import { Comment, Edit, Image, Link, Upload } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.content}
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Content Analysis</h2>

			<!-- Post Types -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Post Types</h3>
				<div class="stats stats-vertical w-full shadow">
					<div class="stat">
						<div class="stat-figure text-primary">
							<Edit />
						</div>
						<div class="stat-title">Original Posts</div>
						<div class="stat-value text-primary">
							{user_store.data.content.post_types.original_posts.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">Direct posts to your feed</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-secondary">
							<Comment />
						</div>
						<div class="stat-title">Replies</div>
						<div class="stat-value text-secondary">
							{user_store.data.content.post_types.replies.toFixed(0)}
						</div>
						<div class="stat-desc">Responses to other posts</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-accent">
							<Upload />
						</div>
						<div class="stat-title">Reposts</div>
						<div class="stat-value text-accent">
							{user_store.data.content.post_types.reposts.toFixed(0)}
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
							<Image />
						</div>
						<div class="stat-title">Media Posts</div>
						<div class="stat-value text-info">
							{user_store.data.content.post_types.with_media.toFixed(
								0,
							)}
						</div>
						<div class="stat-desc">Posts containing images</div>
					</div>

					<div class="stat">
						<div class="stat-figure text-success">
							<Link />
						</div>
						<div class="stat-title">Posts with Links</div>
						<div class="stat-value text-success">
							{user_store.data.content.post_types.with_links.toFixed(
								0,
							)}
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
								{user_store.data.content.post_lengths.average.toFixed(
									0,
								)}
							</div>
							<div class="stat-desc">characters per post</div>
						</div>
						<div class="stat">
							<div class="stat-title">Median Length</div>
							<div class="stat-value">
								{user_store.data.content.post_lengths.median}
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
										{user_store.data.content.post_lengths.distribution
											.short}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Medium (50-200)</span>
									<span class="badge badge-secondary">
										{user_store.data.content.post_lengths.distribution
											.medium}
									</span>
								</div>
								<div class="flex items-center justify-between">
									<span>Long (>200)</span>
									<span class="badge badge-accent">
										{user_store.data.content.post_lengths.distribution
											.long}
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
