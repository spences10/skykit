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

		if (posts.data.feed.length > 0) {
			for (const item of posts.data.feed) {
				const post_date = parseISO(item.post.indexedAt);
				if (post_date > most_recent_date) {
					most_recent_date = post_date;
				}
			}
		}

		return most_recent_date;
	} catch (error) {
		console.error(`Error fetching activity for ${did}:`, error);
		return new Date(0);
	}
}
