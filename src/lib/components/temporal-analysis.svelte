<script lang="ts">
	import { Calender, CircleCheck, Spark } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.temporal}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<header class="mb-4 flex items-center gap-2">
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
			</header>

			<!-- Posting Frequency -->
			<section class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Posting Frequency</h3>
				<dl
					class="stats stats-vertical w-full shadow md:stats-horizontal"
				>
					<div class="stat">
						<dt class="stat-figure text-primary">
							<Calender />
						</dt>
						<dd class="stat-title">Daily Posts</dd>
						<dd class="stat-value text-primary">
							{user_store.data.temporal.posting_frequency.posts_per_day.toFixed(
								2,
							)}
						</dd>
						<dd class="stat-desc">
							{user_store.data.temporal.posting_frequency.posts_per_week.toFixed(
								1,
							)} posts per week
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-secondary">
							<CircleCheck />
						</dt>
						<dd class="stat-title">Active Days</dd>
						<dd class="stat-value text-secondary">
							{user_store.data.temporal.posting_frequency.active_days_percentage.toFixed(
								0,
							)}%
						</dd>
						<dd class="stat-desc">
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
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Spark />
						</dt>
						<dd class="stat-title">Posting Streak</dd>
						<dd class="stat-value text-accent">
							{user_store.data.temporal.posting_frequency.longest_streak.toFixed(
								0,
							)}
						</dd>
						<dd class="stat-desc">Consecutive days posting</dd>
					</div>
				</dl>
			</section>

			<!-- Activity Patterns -->
			<div class="grid gap-4 md:grid-cols-2">
				<!-- Peak Hours -->
				<section class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">Most Active Hours</h3>
						<dl class="space-y-2">
							{#each user_store.data.temporal.posting_frequency.most_active_hours.slice(0, 3) as [hour, count]}
								<div class="flex items-center justify-between">
									<dt>{hour}</dt>
									<dd class="badge badge-primary">
										{count} posts
									</dd>
								</div>
							{/each}
						</dl>
					</div>
				</section>

				<!-- Active Days -->
				<section class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">Most Active Days</h3>
						<dl class="space-y-2">
							{#each user_store.data.temporal.posting_frequency.most_active_days.slice(0, 3) as [day, count]}
								<div class="flex items-center justify-between">
									<dt>{day}</dt>
									<dd class="badge badge-secondary">
										{count} posts
									</dd>
								</div>
							{/each}
						</dl>
					</div>
				</section>
			</div>

			<!-- Peak Activity Windows -->
			<section class="mt-6">
				<h3 class="mb-2 text-lg font-semibold">
					Peak Activity Windows
				</h3>
				<ul class="flex flex-wrap gap-2" role="list">
					{#each user_store.data.temporal.peak_activity_windows as window}
						<li class="badge badge-lg">{window}</li>
					{/each}
				</ul>
			</section>
		</div>
	</article>
{/if}
