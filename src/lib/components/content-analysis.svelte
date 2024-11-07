<script lang="ts">
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
							{user_store.data.content.post_types.original_posts.toFixed(
								0,
							)}
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
							{user_store.data.content.post_types.replies.toFixed(0)}
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
							{user_store.data.content.post_types.with_media}
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
