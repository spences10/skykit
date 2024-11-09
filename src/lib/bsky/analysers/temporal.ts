import type { BskyPost, TemporalPatterns } from '../types';

export function analyse_temporal_patterns(
	posts: BskyPost[],
): TemporalPatterns {
	return {
		posting_frequency: calculate_posting_frequency(posts),
		consistency_score: calculate_consistency_score(posts),
		peak_activity_windows: find_peak_activity_windows(posts),
	};
}

function calculate_posting_frequency(posts: BskyPost[]) {
	if (!posts.length)
		return {
			posts_per_day: 0,
			posts_per_week: 0,
			active_days_percentage: 0,
			longest_streak: 0,
			most_active_hours: [],
			most_active_days: [],
			date_range: {
				from: null,
				to: null,
				total_days: 0,
			},
		};

	const dates = posts.map((p) => new Date(p.post.indexedAt));
	const earliest = new Date(
		Math.min(...dates.map((d) => d.getTime())),
	);
	const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

	const total_days = Math.max(
		1,
		Math.ceil(
			(latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24),
		),
	);

	// Group posts by day
	const posts_by_day = new Map<string, number>();
	const posts_by_hour = new Map<number, number>();
	const posts_by_weekday = new Map<string, number>();

	posts.forEach((post) => {
		const date = new Date(post.post.indexedAt);
		const day_key = date.toISOString().split('T')[0];
		const hour = date.getHours();
		const weekday = date.toLocaleDateString('en-GB', {
			weekday: 'long',
		});

		posts_by_day.set(day_key, (posts_by_day.get(day_key) || 0) + 1);
		posts_by_hour.set(hour, (posts_by_hour.get(hour) || 0) + 1);
		posts_by_weekday.set(
			weekday,
			(posts_by_weekday.get(weekday) || 0) + 1,
		);
	});

	// Calculate longest streak
	const sorted_days = Array.from(posts_by_day.keys()).sort();
	let current_streak = 1;
	let longest_streak = 1;

	for (let i = 1; i < sorted_days.length; i++) {
		const curr_date = new Date(sorted_days[i]);
		const prev_date = new Date(sorted_days[i - 1]);
		const day_diff =
			(curr_date.getTime() - prev_date.getTime()) /
			(1000 * 60 * 60 * 24);

		if (day_diff === 1) {
			current_streak++;
			longest_streak = Math.max(longest_streak, current_streak);
		} else {
			current_streak = 1;
		}
	}

	const most_active_hours: [string, number][] = Array.from(
		posts_by_hour.entries(),
	)
		.sort(([, a], [, b]) => b - a)
		.map(([hour, count]): [string, number] => [
			`${hour.toString().padStart(2, '0')}:00`,
			count,
		])
		.slice(0, 5);

	const active_days_percentage =
		(posts_by_day.size / total_days) * 100;

	return {
		posts_per_day: posts.length / total_days,
		posts_per_week: (posts.length / total_days) * 7,
		active_days_percentage,
		longest_streak,
		most_active_hours,
		most_active_days: Array.from(posts_by_weekday.entries()).sort(
			([, a], [, b]) => b - a,
		),
		date_range: {
			from: earliest.toISOString(),
			to: latest.toISOString(),
			total_days,
		},
	};
}

function calculate_consistency_score(posts: BskyPost[]): number {
	if (!posts.length) return 0;

	const dates = posts.map((p) => new Date(p.post.indexedAt));
	const earliest = new Date(
		Math.min(...dates.map((d) => d.getTime())),
	);
	const latest = new Date(Math.max(...dates.map((d) => d.getTime())));

	// Create a map of posts per day
	const posts_by_day = new Map<string, number>();
	posts.forEach((post) => {
		const day_key = new Date(post.post.indexedAt)
			.toISOString()
			.split('T')[0];
		posts_by_day.set(day_key, (posts_by_day.get(day_key) || 0) + 1);
	});

	// Calculate standard deviation of posts per day
	const values = Array.from(posts_by_day.values());
	const mean = values.reduce((a, b) => a + b, 0) / values.length;
	const variance =
		values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
		values.length;
	const std_dev = Math.sqrt(variance);

	// Calculate coefficient of variation (lower is more consistent)
	const cv = std_dev / mean;

	// Convert to a 0-1 score where 1 is most consistent
	const consistency = Math.max(0, Math.min(1, 1 - cv));

	return consistency;
}

function find_peak_activity_windows(posts: BskyPost[]): string[] {
	if (!posts.length) return [];

	// Create 3-hour windows
	const windows = new Map<string, number>();

	posts.forEach((post) => {
		const date = new Date(post.post.indexedAt);
		const hour = date.getHours();
		const window_start = Math.floor(hour / 3) * 3;
		const window_key = `${window_start.toString().padStart(2, '0')}:00-${((window_start + 3) % 24).toString().padStart(2, '0')}:00`;

		windows.set(window_key, (windows.get(window_key) || 0) + 1);
	});

	// Find windows with above-average activity
	const values = Array.from(windows.values());
	const mean = values.reduce((a, b) => a + b, 0) / values.length;

	return Array.from(windows.entries())
		.filter(([, count]) => count > mean)
		.sort(([, a], [, b]) => b - a)
		.map(([window]) => window);
}
