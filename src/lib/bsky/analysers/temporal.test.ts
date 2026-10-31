import type { BskyPost } from '#lib/types.js';
import { describe, expect, it } from 'vitest';
import { analyse_temporal_patterns } from './temporal';

const post_at = (iso: string) =>
	({ post: { indexedAt: iso } }) as unknown as BskyPost;

describe('analyse_temporal_patterns', () => {
	it('ignores posts older than the 30-day window', () => {
		// Every day for 60 days: only the last 31 calendar days count
		const posts = Array.from({ length: 60 }, (_, i) =>
			post_at(new Date(Date.UTC(2026, 9, 30 - i, 12)).toISOString()),
		);
		const { posting_frequency } = analyse_temporal_patterns(
			posts,
			'UTC',
		);

		expect(posting_frequency.date_range.total_days).toBe(31);
		expect(posting_frequency.active_days_percentage).toBe(100);
		expect(posting_frequency.posts_per_day).toBe(1);
		expect(posting_frequency.longest_streak).toBe(31);
		const day_total = posting_frequency.most_active_days.reduce(
			(sum, [, count]) => sum + count,
			0,
		);
		const hour_total = posting_frequency.most_active_hours.reduce(
			(sum, [, count]) => sum + count,
			0,
		);
		expect(day_total).toBe(31);
		expect(hour_total).toBe(31);
	});

	it('never reports more active days than days in range', () => {
		// Posts late and early on calendar days less than 24h apart
		const posts = [
			post_at('2026-10-01T23:00:00Z'),
			post_at('2026-10-02T01:00:00Z'),
		];
		const { posting_frequency } = analyse_temporal_patterns(
			posts,
			'UTC',
		);

		expect(posting_frequency.date_range.total_days).toBe(2);
		expect(posting_frequency.active_days_percentage).toBe(100);
	});

	it('builds active days, hours and peak windows from in-window posts only', () => {
		// In window: Mondays at 09:00. Older than 30 days: Tuesdays at 18:00
		const recent = ['2026-10-26', '2026-10-19', '2026-10-12'].map(
			(day) => post_at(`${day}T09:00:00Z`),
		);
		const old = Array.from({ length: 10 }, () =>
			post_at('2026-08-04T18:00:00Z'),
		);
		const { posting_frequency, peak_activity_windows } =
			analyse_temporal_patterns([...recent, ...old], 'UTC');

		expect(posting_frequency.most_active_days).toEqual([
			['Monday', 3],
		]);
		expect(posting_frequency.most_active_hours).toEqual([
			['09:00', 3],
		]);
		expect(peak_activity_windows).toEqual(['Monday|09:00-10:00|3']);
	});

	it('reports hours and days in the viewer timezone once', () => {
		// 03:30 UTC Tuesday is 23:30 Monday in New York (EDT, UTC-4)
		const posts = [post_at('2026-10-13T03:30:00Z')];
		const { posting_frequency, peak_activity_windows } =
			analyse_temporal_patterns(posts, 'America/New_York');

		expect(posting_frequency.most_active_hours).toEqual([
			['23:00', 1],
		]);
		expect(posting_frequency.most_active_days).toEqual([
			['Monday', 1],
		]);
		expect(peak_activity_windows).toEqual(['Monday|23:00-24:00|1']);
	});
});
