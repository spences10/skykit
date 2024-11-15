<script lang="ts">
	import {
		Calender,
		CircleCheck,
		InformationCircle,
		Spark,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	// Add this helper function
	const group_windows_by_day = (windows: string[]) => {
		const groups = new Map<string, string[]>();

		windows.forEach((window) => {
			const [day, time] = window.split(' at ');
			const dayName = day.replace('s', '');
			if (!groups.has(dayName)) {
				groups.set(dayName, []);
			}
			groups.get(dayName)?.push(time);
		});

		return Array.from(groups.entries());
	};

	const get_post_count_for_time = (
		day: string,
		time: string,
		active_hours: Array<[string, number]>,
	) => {
		const hour = time.split(':')[0];
		const matching_hour = active_hours.find(([h]) =>
			h.startsWith(hour),
		);
		return matching_hour ? matching_hour[1] : 0;
	};

	const add_hour = (time: string) => {
		const hour = parseInt(time.split(':')[0]);
		const next_hour = (hour + 1) % 24;
		return `${next_hour.toString().padStart(2, '0')}:00`;
	};

	const sort_times_chronologically = (times: string[]) => {
		return times.sort((a, b) => {
			const hour_a = parseInt(a.split(':')[0]);
			const hour_b = parseInt(b.split(':')[0]);
			return hour_a - hour_b;
		});
	};

	const group_by_day = (windows: string[]) => {
		const groups = new Map<
			string,
			Array<{ timeRange: string; count: number }>
		>();

		windows.forEach((window) => {
			const [day, timeRange, count] = window.split('|');
			if (!groups.has(day)) {
				groups.set(day, []);
			}
			groups.get(day)?.push({ timeRange, count: parseInt(count) });
		});

		return Array.from(groups.entries());
	};
</script>

{#if user_store.data.temporal}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<header class="mb-4 flex items-center gap-2">
				<h2 class="card-title">
					Posting Patterns
					<div
						class="tooltip cursor-pointer"
						data-tip="Analysis of when and how frequently you post"
					>
						<InformationCircle
							class_names="h-5 w-5 text-base-content/60"
						/>
					</div>
				</h2>

				{#if user_store.data.temporal.posting_frequency.date_range.from && user_store.data.temporal.posting_frequency.date_range.to}
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
			</header>

			<!-- Posting Frequency -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Posting Frequency
					<div
						class="tooltip cursor-pointer"
						data-tip="How often you post and your consistency over time"
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
							<Calender />
						</dt>
						<dd class="stat-title">Daily Posts</dd>
						<dd class="stat-value text-primary">
							{Math.round(
								user_store.data.temporal.posting_frequency
									.posts_per_day,
							)}
						</dd>
						<dd class="stat-desc">
							~{user_store.data.temporal.posting_frequency.posts_per_week.toFixed(
								0,
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
						</dd>
					</div>

					<div class="stat">
						<dt class="stat-figure text-accent">
							<Spark />
						</dt>
						<dd class="stat-title">Posting Streak</dd>
						<dd class="stat-value text-accent">
							{user_store.data.temporal.posting_frequency
								.longest_streak}
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
						<h3 class="card-title flex items-center gap-2 text-sm">
							Most Active Hours
							<div
								class="tooltip cursor-pointer"
								data-tip="Times of day when you post most frequently"
							>
								<InformationCircle
									class_names="h-4 w-4 text-base-content/60"
								/>
							</div>
						</h3>
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
						<h3 class="card-title flex items-center gap-2 text-sm">
							Most Active Days
							<div
								class="tooltip cursor-pointer"
								data-tip="Days of the week when you're most active"
							>
								<InformationCircle
									class_names="h-4 w-4 text-base-content/60"
								/>
							</div>
						</h3>
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
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Peak Activity Windows
					<div
						class="tooltip cursor-pointer"
						data-tip="Shows your most active posting times grouped by day of the week. Post counts are aggregated across multiple weeks."
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<p class="mb-4 text-sm text-base-content/60">
					Showing your top 3 most active days and their busiest
					posting hours
				</p>
				<div class="join join-vertical w-full">
					{#each group_by_day(user_store.data.temporal.peak_activity_windows) as [day, times]}
						<div
							class="collapse join-item collapse-arrow border border-base-200"
						>
							<input type="checkbox" name="peak-activity-windows" />
							<div class="collapse-title text-sm font-medium">
								{day}
							</div>
							<div class="collapse-content">
								<div class="flex flex-wrap gap-2">
									{#each times as { timeRange, count }}
										<div class="flex items-center gap-1">
											<span class="badge badge-ghost"
												>{timeRange}</span
											>
											<span class="badge badge-primary badge-sm"
												>{count}</span
											>
										</div>
									{/each}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</article>
{/if}

<style>
	/* Add custom tooltip styles */
	:global(.tooltip) {
		--tooltip-tail: 3px;
		--tooltip-color: hsl(var(--p));
		--tooltip-text-color: hsl(var(--pc));
		max-width: none !important;
	}
</style>
