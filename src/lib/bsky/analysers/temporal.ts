import type { BskyPost, TemporalPatterns } from '$lib/types';

export function analyse_temporal_patterns(
	posts: BskyPost[],
): TemporalPatterns {
	const dates = posts.map((post) => new Date(post.post.indexedAt));

	// Sort dates to get the most recent 100 posts timeframe
	const sorted_dates = dates.sort(
		(a, b) => b.getTime() - a.getTime(),
	);

	// Use the most recent date as the end date
	const latest = sorted_dates[0];
	// Use either 30 days ago or the earliest post date, whichever is more recent
	const thirty_days_ago = new Date(
		latest.getTime() - 30 * 24 * 60 * 60 * 1000,
	);
	const earliest = new Date(
		Math.max(
			thirty_days_ago.getTime(),
			Math.min(...dates.map((d) => d.getTime())),
		),
	);

	// Calculate date range
	const total_days = Math.ceil(
		(latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24),
	);

	// Group posts by date for active days calculation
	const posts_by_date = new Map<string, number>();
	dates.forEach((date) => {
		const day = date.toISOString().split('T')[0];
		posts_by_date.set(day, (posts_by_date.get(day) || 0) + 1);
	});

	// Calculate active days percentage
	const active_days = posts_by_date.size;
	const active_days_percentage = (active_days / total_days) * 100;

	// Calculate longest streak
	const longest_streak = calculate_longest_streak(posts_by_date);

	// Calculate posting frequency
	const posts_per_day = posts.length / total_days;
	const posts_per_week = posts_per_day * 7;

	// Calculate most active hours
	const posting_hours = new Map<string, number>();
	dates.forEach((date) => {
		const hour = date.getHours();
		const hour_str = `${hour.toString().padStart(2, '0')}:00`;
		posting_hours.set(
			hour_str,
			(posting_hours.get(hour_str) || 0) + 1,
		);
	});

	// Calculate most active days
	const posting_days = new Map<string, number>();
	dates.forEach((date) => {
		const day = date.toLocaleDateString('en-US', { weekday: 'long' });
		posting_days.set(day, (posting_days.get(day) || 0) + 1);
	});

	// Calculate peak activity windows
	const peak_windows = calculate_peak_activity_windows(dates);

	return {
		posting_frequency: {
			posts_per_day,
			posts_per_week,
			date_range: {
				from: earliest.toISOString(),
				to: latest.toISOString(),
				total_days,
			},
			active_days_percentage,
			longest_streak,
			most_active_hours: Array.from(posting_hours.entries()).sort(
				([, a], [, b]) => b - a,
			),
			most_active_days: Array.from(posting_days.entries()).sort(
				([, a], [, b]) => b - a,
			),
		},
		peak_activity_windows: peak_windows,
	};
}

function calculate_longest_streak(
	posts_by_date: Map<string, number>,
): number {
	const dates = Array.from(posts_by_date.keys()).sort();
	let current_streak = 1;
	let max_streak = 1;

	for (let i = 1; i < dates.length; i++) {
		const current = new Date(dates[i]);
		const prev = new Date(dates[i - 1]);
		const diff =
			(current.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

		if (diff === 1) {
			current_streak++;
			max_streak = Math.max(max_streak, current_streak);
		} else {
			current_streak = 1;
		}
	}

	return max_streak;
}

function calculate_peak_activity_windows(dates: Date[]): string[] {
	// Create a map of day -> hours with post counts
	const day_hour_counts = new Map<number, Map<number, number>>();

	// Group all posts by day and hour
	dates.forEach((date) => {
		const day = date.getDay();
		const hour = date.getHours();

		if (!day_hour_counts.has(day)) {
			day_hour_counts.set(day, new Map());
		}
		const hour_counts = day_hour_counts.get(day)!;
		hour_counts.set(hour, (hour_counts.get(hour) || 0) + 1);
	});

	// Calculate total posts per day
	const day_totals = new Map<number, number>();
	day_hour_counts.forEach((hours, day) => {
		const total = Array.from(hours.values()).reduce(
			(a, b) => a + b,
			0,
		);
		day_totals.set(day, total);
	});

	// Get top 3 most active days
	const top_days = Array.from(day_totals.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3);

	// Generate windows for top days
	const windows: string[] = [];
	top_days.forEach(([day, _]) => {
		const hour_counts = day_hour_counts.get(day)!;
		const day_name = new Date(2024, 0, day).toLocaleDateString(
			'en-GB',
			{ weekday: 'long' },
		);

		// Get top hours for this day
		const sorted_hours = Array.from(hour_counts.entries())
			.sort(([, a], [, b]) => b - a)
			.slice(0, 5); // Take top 5 hours

		sorted_hours.forEach(([hour, count]) => {
			const start_time = `${hour.toString().padStart(2, '0')}:00`;
			const end_time = `${(hour + 1).toString().padStart(2, '0')}:00`;
			windows.push(`${day_name}|${start_time}-${end_time}|${count}`);
		});
	});

	return windows;
}
