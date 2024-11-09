<script lang="ts">
	import { Calender, CircleCheck, Spark } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.temporal}
	<div class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center gap-2">
				<h2 class="card-title">Posting Patterns</h2>

				{#if user_store.data.temporal.posting_frequency.date_range.from && user_store.data.temporal.posting_frequency.date_range.to}
					<div
						class="tooltip tooltip-right"
						data-tip={`Analysis from ${new Date(user_store.data.temporal.posting_frequency.date_range.from).toLocaleDateString()} to ${new Date(user_store.data.temporal.posting_frequency.date_range.to).toLocaleDateString()}`}
					>
						<span class="badge badge-sm">
							{user_store.data.temporal.posting_frequency.date_range
								.total_days} days
						</span>
					</div>
				{/if}
			</div>

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
								2,
							)}
						</div>
						<div class="stat-desc">
							{user_store.data.temporal.posting_frequency.posts_per_week.toFixed(
								1,
							)} posts per week
						</div>
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
						<div class="stat-desc">
							Over {user_store.data.temporal.posting_frequency
								.date_range.total_days} days
							{#if user_store.data.temporal.posting_frequency.date_range.from && user_store.data.temporal.posting_frequency.date_range.to}
								({new Date(
									user_store.data.temporal.posting_frequency.date_range.from,
								).toLocaleDateString()}
								-
								{new Date(
									user_store.data.temporal.posting_frequency.date_range.to,
								).toLocaleDateString()})
							{/if}
						</div>
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
