<script lang="ts">
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.temporal}
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
							{user_store.data.temporal.posting_frequency.posts_per_day.toFixed(
								0,
							)}
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
							{user_store.data.temporal.posting_frequency.active_days_percentage.toFixed(
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
							{user_store.data.temporal.posting_frequency.longest_streak.toFixed(
								0,
							)}
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
							{#each user_store.data.temporal.posting_frequency.most_active_hours.slice(0, 3) as [hour, count]}
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
							{#each user_store.data.temporal.posting_frequency.most_active_days.slice(0, 3) as [day, count]}
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
					{#each user_store.data.temporal.peak_activity_windows as window}
						<span class="badge badge-lg">{window}</span>
					{/each}
				</div>
			</div>
		</div>
	</div>
{/if}
