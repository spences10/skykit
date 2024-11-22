import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays, parseISO } from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

interface CachedFollows {
	follows: Array<InactiveFollow & { lastPostDate: Date }>;
	timestamp: number;
}

const follows_cache = new Map<string, CachedFollows>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function get_profile(handle: string) {
	return await rate_limiter.add_to_queue(() =>
		agent.api.app.bsky.actor.getProfile({
			actor: handle,
		}),
	);
}

async function get_all_follows(agent: AtpAgent, did: string) {
	try {
		const follows = await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.graph.getFollows({
				actor: did,
				limit: 100,
			}),
		);

		if (!follows.data.follows) return [];

		const follows_with_posts = [];
		const now = new Date();

		for (const follow of follows.data.follows) {
			const latest_post = await rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: follow.did,
					limit: 1,
				}),
			);

			const last_post_date = latest_post.data.feed[0]
				? parseISO(latest_post.data.feed[0].post.indexedAt)
				: new Date(0);

			follows_with_posts.push({
				did: follow.did,
				handle: follow.handle,
				displayName: follow.displayName,
				lastPost: last_post_date.toISOString(),
				lastPostDate: last_post_date,
			});
		}

		return follows_with_posts;
	} catch (err) {
		console.error('Error fetching follows:', err);
		return [];
	}
}

function get_cached_data(handle: string, days: number) {
	const cached = follows_cache.get(handle);
	const now = new Date();

	if (cached && now.getTime() - cached.timestamp < CACHE_TTL) {
		return cached.follows
			.filter(
				(follow) =>
					differenceInDays(now, follow.lastPostDate) >= days,
			)
			.map(({ lastPostDate, ...follow }) => follow);
	}

	return null;
}

function cache_follows(
	handle: string,
	follows: Array<InactiveFollow & { lastPostDate: Date }>,
) {
	const now = new Date();
	follows_cache.set(handle, {
		follows,
		timestamp: now.getTime(),
	});

	// Clean up old cache entries
	for (const [key, value] of follows_cache) {
		if (now.getTime() - value.timestamp > CACHE_TTL) {
			follows_cache.delete(key);
		}
	}
}

function filter_inactive_follows(
	follows: Array<InactiveFollow & { lastPostDate: Date }>,
	days: number,
) {
	const now = new Date();
	return follows
		.filter(
			(follow) => differenceInDays(now, follow.lastPostDate) >= days,
		)
		.map(({ lastPostDate, ...follow }) => follow);
}

function handle_error(err: any) {
	console.error('Error:', err);
	throw error(500, 'Failed to fetch inactive follows');
}

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');
	const days = Number(url.searchParams.get('days')) || 30;

	if (!handle) {
		throw error(400, 'Handle is required');
	}

	try {
		const cached_data = get_cached_data(handle, days);
		if (cached_data) {
			return Response.json({
				inactive_follows: cached_data,
				cache: 'hit',
			});
		}

		const profile = await get_profile(handle);
		const all_follows = await get_all_follows(
			agent,
			profile.data.did,
		);
		cache_follows(handle, all_follows);

		const inactive_follows = filter_inactive_follows(
			all_follows,
			days,
		);

		return Response.json({
			inactive_follows,
			cache: 'miss',
		});
	} catch (err) {
		handle_error(err);
	}
};
