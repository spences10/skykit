import type { BskyPost, TemporalPatterns } from '$lib/types';
import {
	differenceInDays,
	differenceInMilliseconds,
	format,
	formatISO,
	getDay,
	getHours,
	parseISO,
	setDay,
	subDays,
} from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

interface PostingMetrics {
	total_days: number;
	active_days: number;
	posts_per_day: number;
	longest_streak: number;
}

export function analyse_temporal_patterns(
	posts: BskyPost[],
	timezone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
	use_full_range: boolean = false,
): TemporalPatterns {
	// Convert UTC dates to user's timezone
	const dates = posts.map((post) =>
		toZonedTime(new Date(post.post.indexedAt), timezone),
	);
	const [earliest, latest] = get_date_range(dates, use_full_range);
	const metrics = calculate_posting_metrics(dates, earliest, latest);

	return {
		posting_frequency: {
			posts_per_day: metrics.posts_per_day,
			posts_per_week: metrics.posts_per_day * 7,
			date_range: {
				from: formatISO(earliest),
				to: formatISO(latest),
				total_days: metrics.total_days,
			},
			active_days_percentage:
				(metrics.active_days / metrics.total_days) * 100,
			longest_streak: metrics.longest_streak,
			most_active_hours: get_most_active_hours(dates, timezone),
			most_active_days: get_most_active_days(dates, timezone),
		},
		peak_activity_windows: calculate_peak_activity_windows(
			dates,
			timezone,
		),
		timezone: timezone,
	};
}

function get_date_range(
	dates: Date[],
	use_full_range: boolean = false,
): [Date, Date] {
	const sorted_dates = dates.sort((a, b) =>
		differenceInMilliseconds(b, a),
	);
	const latest = sorted_dates[0];

	if (use_full_range) {
		// Use the earliest date from all posts
		const earliest = sorted_dates[sorted_dates.length - 1];
		return [earliest, latest];
	} else {
		// Default behavior - limit to 30 days
		const thirty_days_ago = subDays(latest, 30);
		const earliest = new Date(
			Math.max(
				thirty_days_ago.getTime(),
				Math.min(...dates.map((d) => d.getTime())),
			),
		);
		return [earliest, latest];
	}
}

function calculate_posting_metrics(
	dates: Date[],
	earliest: Date,
	latest: Date,
): PostingMetrics {
	const total_days = differenceInDays(latest, earliest) + 1;
	const posts_by_date = group_posts_by_date(dates);

	return {
		total_days,
		active_days: posts_by_date.size,
		posts_per_day: dates.length / total_days,
		longest_streak: calculate_longest_streak(posts_by_date),
	};
}

function group_posts_by_date(dates: Date[]): Map<string, number> {
	const posts_by_date = new Map<string, number>();
	dates.forEach((date) => {
		const day = format(date, 'yyyy-MM-dd');
		posts_by_date.set(day, (posts_by_date.get(day) || 0) + 1);
	});
	return posts_by_date;
}

function get_most_active_hours(
	dates: Date[],
	timezone: string,
): Array<[string, number]> {
	const posting_hours = new Map<string, number>();
	dates.forEach((date) => {
		const hour_str = formatInTimeZone(date, timezone, 'HH:00');
		posting_hours.set(
			hour_str,
			(posting_hours.get(hour_str) || 0) + 1,
		);
	});
	return Array.from(posting_hours.entries()).sort(
		([, a], [, b]) => b - a,
	);
}

function get_most_active_days(
	dates: Date[],
	timezone: string,
): Array<[string, number]> {
	const posting_days = new Map<string, number>();
	dates.forEach((date) => {
		const day = formatInTimeZone(date, timezone, 'EEEE');
		posting_days.set(day, (posting_days.get(day) || 0) + 1);
	});
	return Array.from(posting_days.entries()).sort(
		([, a], [, b]) => b - a,
	);
}

function calculate_longest_streak(
	posts_by_date: Map<string, number>,
): number {
	const dates = Array.from(posts_by_date.keys())
		.map((dateStr) => parseISO(dateStr))
		.sort((a, b) => a.getTime() - b.getTime());

	let current_streak = 1;
	let max_streak = 1;

	for (let i = 1; i < dates.length; i++) {
		const diff = differenceInDays(dates[i], dates[i - 1]);

		if (diff === 1) {
			current_streak++;
			max_streak = Math.max(max_streak, current_streak);
		} else {
			current_streak = 1;
		}
	}

	return max_streak;
}

function calculate_peak_activity_windows(
	dates: Date[],
	timezone: string,
): string[] {
	const day_hour_counts = new Map<number, Map<number, number>>();

	dates.forEach((date) => {
		const day = getDay(date);
		const hour = getHours(date);

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
		const day_name = formatInTimeZone(
			setDay(new Date(), day),
			timezone,
			'EEEE',
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
