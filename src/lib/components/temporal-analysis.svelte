<script lang="ts">
	import { Calender, CircleCheck, Spark } from '$lib/icons';
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
							<Calender />
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
							<CircleCheck />
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
							<Spark />
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
