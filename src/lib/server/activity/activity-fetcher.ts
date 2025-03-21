import { rate_limiter } from '$lib/rate-limiter';
import type { AtpAgent } from '@atproto/api';
import { differenceInDays, parseISO } from 'date-fns';
import { retry_with_backoff } from '../utils';
import {
	RECENT_ACTIVITY_THRESHOLD,
	type FeedOptions,
} from './constants';

export async function get_latest_activity(
	agent: AtpAgent,
	did: string,
	profile_indexed_at: string | undefined,
	options: FeedOptions,
): Promise<Date> {
	try {
		if (profile_indexed_at) {
			const indexed_date = parseISO(profile_indexed_at);
			if (
				differenceInDays(new Date(), indexed_date) <
				RECENT_ACTIVITY_THRESHOLD
			) {
				return indexed_date;
			}
		}

		const posts = await retry_with_backoff(() =>
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: did,
					limit: options.limit,
					filter: options.filter,
				}),
			),
		);

		let most_recent_date = new Date(0);
		let most_recent_regular_post_date = new Date(0);

		// Only process the first two posts
		const recent_posts = posts.data.feed.slice(0, 2);

		if (recent_posts.length > 0) {
			for (const item of recent_posts) {
				// Safely access createdAt or fall back to indexedAt
				const post_date = parseISO(
					(item.post.record as { createdAt?: string })?.createdAt ||
						item.post.indexedAt,
				);

				// Check if this is a pinned post by looking for the pinned label
				const is_pinned = item.post.labels?.some(
					(label) => label.val === 'pinned',
				);

				// Consider all post types (original, reply, repost) as activity
				// Only exclude pinned posts if they're older than regular posts
				if (!is_pinned || post_date > most_recent_regular_post_date) {
					most_recent_regular_post_date = post_date;
				}

				// Track the most recent post regardless of type
				if (post_date > most_recent_date) {
					most_recent_date = post_date;
				}
			}
		}

		// If we found a regular post in the first two posts, use its date
		// Otherwise fall back to the most recent date (which might be a pinned post)
		return most_recent_regular_post_date.getTime() > 0
			? most_recent_regular_post_date
			: most_recent_date;
	} catch (error) {
		console.error(`Error fetching activity for ${did}:`, error);
		return new Date(0);
	}
}
