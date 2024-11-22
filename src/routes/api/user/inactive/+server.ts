import { rate_limiter } from '$lib/rate-limiter';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays } from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

// Cache structure: Map<handle, { follows: Array<InactiveFollow & { lastPostDate: Date }>, timestamp: number }>
const follows_cache = new Map<
	string,
	{
		follows: Array<{
			did: string;
			handle: string;
			displayName?: string;
			lastPost: string;
			lastPostDate: Date;
		}>;
		timestamp: number;
	}
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

async function get_all_follows(
	agent: AtpAgent,
	did: string,
): Promise<
	Array<{
		did: string;
		handle: string;
		displayName?: string;
		lastPost: string;
		lastPostDate: Date;
	}>
> {
	try {
		console.log('Fetching all follows');
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
				? new Date(latest_post.data.feed[0].post.indexedAt)
				: new Date(0);

			follows_with_posts.push({
				did: follow.did,
				handle: follow.handle,
				displayName: follow.displayName,
				lastPost: last_post_date.toISOString(),
				lastPostDate: last_post_date,
			});
		}

		return follows_with_posts.sort(
			(a, b) => b.lastPostDate.getTime() - a.lastPostDate.getTime(),
		);
	} catch (err) {
		console.error('Error fetching follows:', err);
		return [];
	}
}

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');
	const days = Number(url.searchParams.get('days')) || 30;

	if (!handle) {
		throw error(400, 'Handle is required');
	}

	console.log(
		`Checking inactive follows for ${handle} (${days} days)`,
	);

	try {
		// Check cache first
		const cached = follows_cache.get(handle);
		const now = new Date();

		if (cached && now.getTime() - cached.timestamp < CACHE_TTL) {
			console.log('Cache hit for', handle);
			// Filter cached follows based on requested days threshold
			const inactive_follows = cached.follows
				.filter(
					(follow) =>
						differenceInDays(now, follow.lastPostDate) >= days,
				)
				.map(({ lastPostDate, ...follow }) => follow);

			return Response.json({
				inactive_follows,
				cache: 'hit',
			});
		}

		// If not cached or expired, fetch everything
		const profile = await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.actor.getProfile({
				actor: handle,
			}),
		);

		if (!profile.data) {
			throw error(404, 'Profile not found');
		}

		const all_follows = await get_all_follows(
			agent,
			profile.data.did,
		);

		// Cache all follows data
		follows_cache.set(handle, {
			follows: all_follows,
			timestamp: now.getTime(),
		});

		// Clean up old cache entries
		for (const [key, value] of follows_cache) {
			if (now.getTime() - value.timestamp > CACHE_TTL) {
				follows_cache.delete(key);
			}
		}

		// Filter based on requested days threshold
		const inactive_follows = all_follows
			.filter(
				(follow) =>
					differenceInDays(now, follow.lastPostDate) >= days,
			)
			.map(({ lastPostDate, ...follow }) => follow);

		return Response.json({
			inactive_follows,
			cache: 'miss',
		});
	} catch (err) {
		console.error('Error:', err);
		throw error(500, 'Failed to fetch inactive follows');
	}
};
